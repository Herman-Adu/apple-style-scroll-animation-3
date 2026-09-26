"use server"

// Server Actions backing the store settings singleton. Reads are public (the
// layout SSR-seeds the client provider with the authoritative row). Writes are
// admin-only: identity and role are derived from the Better Auth session on the
// server, so the client can never change store settings by calling the action
// directly. Hiding admin UI is not access control; this is the boundary.

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/config"
import { EMPTY_ADDRESS, type CompanyAddress } from "@/lib/data/company"
import { DEFAULT_STORE_SETTINGS, type Currency, type StoreSettings } from "./types"

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error("Not signed in.")
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, roleOverride: true },
  })
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.")
}

/** Reconcile a stored address value (JSON object, legacy string, or missing)
 * back into the structured address shape. */
function normalizeAddress(value: unknown): CompanyAddress {
  if (typeof value === "string") return { ...EMPTY_ADDRESS, line1: value }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...EMPTY_ADDRESS, ...(value as Partial<CompanyAddress>) }
  }
  return { ...EMPTY_ADDRESS }
}

function normalizeCurrency(value: string): Currency {
  return value === "USD" || value === "EUR" || value === "GBP" ? value : "GBP"
}

type SettingsRow = {
  companyName: string
  contactPerson: string
  contactEmail: string
  supportPhone: string
  address: unknown
  vatNumber: string
  industry: string
  logoUrl: string | null
  onboarded: boolean
  storeName: string
  supportEmail: string
  currency: string
  lowStockThreshold: number
  emailAlerts: boolean
}

function toStoreSettings(row: SettingsRow): StoreSettings {
  return {
    companyName: row.companyName,
    contactPerson: row.contactPerson,
    contactEmail: row.contactEmail,
    supportPhone: row.supportPhone,
    address: normalizeAddress(row.address),
    vatNumber: row.vatNumber,
    industry: row.industry,
    logoUrl: row.logoUrl ?? undefined,
    onboarded: row.onboarded,
    storeName: row.storeName,
    supportEmail: row.supportEmail,
    currency: normalizeCurrency(row.currency),
    lowStockThreshold: row.lowStockThreshold,
    emailAlerts: row.emailAlerts,
  }
}

/** Load the singleton row, creating it with defaults on first use. */
async function loadRow() {
  const existing = await prisma.storeSettings.findFirst({ orderBy: { id: "asc" } })
  return existing ?? (await prisma.storeSettings.create({ data: {} }))
}

/** Full store settings. Public read — falls back to defaults if the DB is
 * unreachable so the admin UI still renders. */
export async function getStoreSettingsAction(): Promise<StoreSettings> {
  try {
    return toStoreSettings(await loadRow())
  } catch {
    return DEFAULT_STORE_SETTINGS
  }
}

/** Whitelist a patch down to persistable columns (never trust the client to
 * pass arbitrary keys into the update). */
function toUpdateData(patch: Partial<StoreSettings>): Prisma.StoreSettingsUpdateInput {
  const data: Prisma.StoreSettingsUpdateInput = {}
  if (patch.companyName !== undefined) data.companyName = patch.companyName
  if (patch.contactPerson !== undefined) data.contactPerson = patch.contactPerson
  if (patch.contactEmail !== undefined) data.contactEmail = patch.contactEmail
  if (patch.supportPhone !== undefined) data.supportPhone = patch.supportPhone
  if (patch.address !== undefined) data.address = patch.address as unknown as Prisma.InputJsonValue
  if (patch.vatNumber !== undefined) data.vatNumber = patch.vatNumber
  if (patch.industry !== undefined) data.industry = patch.industry
  if (patch.logoUrl !== undefined) data.logoUrl = patch.logoUrl ?? null
  if (patch.onboarded !== undefined) data.onboarded = patch.onboarded
  if (patch.storeName !== undefined) data.storeName = patch.storeName
  if (patch.supportEmail !== undefined) data.supportEmail = patch.supportEmail
  if (patch.currency !== undefined) data.currency = normalizeCurrency(patch.currency)
  if (patch.lowStockThreshold !== undefined) {
    data.lowStockThreshold = Math.max(0, Math.floor(patch.lowStockThreshold) || 0)
  }
  if (patch.emailAlerts !== undefined) data.emailAlerts = patch.emailAlerts
  return data
}

/** Persist a partial update (admin) and return the fresh, authoritative row. */
export async function updateStoreSettingsAction(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  await requireAdmin()
  const row = await loadRow()
  const updated = await prisma.storeSettings.update({
    where: { id: row.id },
    data: toUpdateData(patch),
  })
  revalidatePath("/admin")
  return toStoreSettings(updated)
}
