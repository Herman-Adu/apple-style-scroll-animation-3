"use server"

// Server Actions backing the `db` auth adapter. Every function derives identity
// from the Better Auth session cookie on the server — the client never supplies
// its own id or role. Management actions additionally require an admin session.
// This is the authorization boundary: hiding UI is not access control.

import { headers } from "next/headers"
import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/config"
import {
  AuthError,
  type OfferTag,
  type ProfileUpdate,
  type Session,
  type User,
  type UserProfile,
  type UserRole,
  type UserStatus,
} from "@/lib/auth/types"

// --- mapping helpers (server-only, not exported) ---------------------------

function normalizeProfile(raw: unknown): UserProfile {
  const profile = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const legacyGoal = typeof profile.goal === "string" ? profile.goal : undefined
  const goals = Array.isArray(profile.goals)
    ? (profile.goals as string[])
    : legacyGoal
      ? [legacyGoal]
      : []
  return {
    displayName: profile.displayName as string | undefined,
    avatarUrl: profile.avatarUrl as string | undefined,
    goals,
    interests: Array.isArray(profile.interests) ? (profile.interests as string[]) : [],
    newsletter: Boolean(profile.newsletter),
    bio: profile.bio as string | undefined,
  }
}

type UserRow = {
  id: string
  email: string
  name: string
  role: string
  status: string
  onboardingStatus: string
  roleOverride: string | null
  profile: unknown
  offers: unknown
  createdAt: Date
}

function toAppUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: effectiveRole(row),
    profile: normalizeProfile(row.profile),
    onboardingStatus: row.onboardingStatus === "complete" ? "complete" : "pending",
    createdAt: row.createdAt.toISOString(),
    status: row.status === "blocked" ? "blocked" : "active",
    roleOverride:
      row.roleOverride === "admin" || row.roleOverride === "customer"
        ? row.roleOverride
        : undefined,
    offers: Array.isArray(row.offers) ? (row.offers as OfferTag[]) : [],
  }
}

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  onboardingStatus: true,
  roleOverride: true,
  profile: true,
  offers: true,
  createdAt: true,
} as const

// --- session guards --------------------------------------------------------

async function sessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

async function requireUserId(): Promise<string> {
  const id = await sessionUserId()
  if (!id) throw new AuthError("Not signed in.", "unauthenticated")
  return id
}

async function requireAdminId(): Promise<string> {
  const id = await requireUserId()
  const me = await prisma.user.findUnique({ where: { id }, select: userSelect })
  if (!me || effectiveRole(me) !== "admin") {
    throw new AuthError("Admins only.", "unauthenticated")
  }
  return id
}

// --- session + profile -----------------------------------------------------

/** Current app session from the Better Auth cookie, enriched from the DB row. */
export async function fetchAppSession(): Promise<Session | null> {
  const id = await sessionUserId()
  if (!id) return null
  const row = await prisma.user.findUnique({ where: { id }, select: userSelect })
  if (!row) return null
  // A live session for an account blocked after sign-in is ejected on reload.
  if (row.status === "blocked") return null
  return { user: toAppUser(row), token: row.id }
}

export async function updateProfileAction(update: ProfileUpdate): Promise<User> {
  const id = await requireUserId()
  const current = await prisma.user.findUnique({ where: { id }, select: { profile: true } })
  const merged = { ...normalizeProfile(current?.profile), ...update }
  const row = await prisma.user.update({
    where: { id },
    data: { profile: merged },
    select: userSelect,
  })
  return toAppUser(row)
}

export async function completeOnboardingAction(update: ProfileUpdate): Promise<User> {
  const id = await requireUserId()
  const current = await prisma.user.findUnique({ where: { id }, select: { profile: true } })
  const merged = { ...normalizeProfile(current?.profile), ...update }
  const row = await prisma.user.update({
    where: { id },
    data: { profile: merged, onboardingStatus: "complete" },
    select: userSelect,
  })
  return toAppUser(row)
}

// --- admin management ------------------------------------------------------

export async function listUsersAction(): Promise<User[]> {
  await requireAdminId()
  const rows = await prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "asc" } })
  return rows.map(toAppUser)
}

export async function setUserStatusAction(id: string, status: UserStatus): Promise<User> {
  await requireAdminId()
  const row = await prisma.user.update({ where: { id }, data: { status }, select: userSelect })
  return toAppUser(row)
}

export async function setUserRoleAction(id: string, role: UserRole): Promise<User> {
  await requireAdminId()
  const row = await prisma.user.update({
    where: { id },
    data: { roleOverride: role },
    select: userSelect,
  })
  return toAppUser(row)
}

export async function setUserNewsletterAction(id: string, newsletter: boolean): Promise<User> {
  await requireAdminId()
  const current = await prisma.user.findUnique({ where: { id }, select: { profile: true } })
  if (!current) throw new AuthError("Customer not found.", "unknown")
  const merged = { ...normalizeProfile(current.profile), newsletter }
  const row = await prisma.user.update({
    where: { id },
    data: { profile: merged },
    select: userSelect,
  })
  return toAppUser(row)
}

export async function setUserOffersAction(id: string, offers: OfferTag[]): Promise<User> {
  await requireAdminId()
  const row = await prisma.user.update({
    where: { id },
    data: { offers: offers as unknown as Prisma.InputJsonValue },
    select: userSelect,
  })
  return toAppUser(row)
}

/**
 * Record that offers were used on an order. Runs in the customer's own session
 * and only ever touches that customer's offers — the passed id is ignored in
 * favor of the session user, so one account can't stamp another's offers.
 * Record-only: it never disables an offer (expiry does that).
 */
export async function markOffersRedeemedAction(offerIds: string[]): Promise<User> {
  const id = await requireUserId()
  const current = await prisma.user.findUnique({ where: { id }, select: { offers: true } })
  const existing = Array.isArray(current?.offers) ? (current!.offers as unknown as OfferTag[]) : []
  const target = new Set(offerIds)
  const now = new Date().toISOString()
  const offers = existing.map((offer) =>
    target.has(offer.id)
      ? { ...offer, redeemedAt: now, redemptionCount: (offer.redemptionCount ?? 0) + 1 }
      : offer,
  )
  const row = await prisma.user.update({
    where: { id },
    data: { offers: offers as unknown as Prisma.InputJsonValue },
    select: userSelect,
  })
  return toAppUser(row)
}
