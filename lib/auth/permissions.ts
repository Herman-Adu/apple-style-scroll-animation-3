import { isOwner } from "./config"
import type { UserRole } from "./types"

/**
 * Pure authorization rules shared by every enforcement layer: the proxy
 * (route gate), the server actions (authoritative check) and the UI (what to
 * show). Keeping them pure means each layer applies the same decision and the
 * rules are unit-tested once.
 */

type Viewer = { email?: string | null; role?: UserRole | string | null } | null | undefined

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message)
    this.name = "AuthorizationError"
  }
}

/**
 * Admins (besides the owner) allowed to lock and unlock email blocks. Read from
 * the server-only EMAIL_BLOCK_LOCKERS variable (comma-separated emails), so the
 * list is never shipped to the browser.
 */
export function blockLockerEmails(raw: string | undefined = process.env.EMAIL_BLOCK_LOCKERS): string[] {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/** The owner can always lock; other admins only when on the locker list. */
export function canLockBlocks(viewer: Viewer, lockers: string[] = blockLockerEmails()): boolean {
  if (!viewer?.email || viewer.role !== "admin") return false
  if (isOwner(viewer.email)) return true
  return lockers.includes(viewer.email.trim().toLowerCase())
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

/** Effective locker list: database grants (managed in the admin UI) plus the env seed. */
export function mergeLockers(dbEmails: string[], envEmails: string[]): string[] {
  return [...new Set([...dbEmails, ...envEmails].map(normalizeEmail).filter(Boolean))]
}

/** Only the owner may grant or revoke lock rights. */
export function canManagePermissions(viewer: Viewer): boolean {
  return Boolean(viewer?.email) && viewer?.role === "admin" && isOwner(viewer.email)
}

export type GrantAction = "grant" | "revoke"
export type GrantValidation = { ok: true; email: string } | { ok: false; error: string }

/** Whether a grant or revoke is valid against the current admins and lockers. */
export function validateGrant(input: {
  action: GrantAction
  subjectEmail: string
  admins: string[]
  lockers: string[]
}): GrantValidation {
  const email = normalizeEmail(input.subjectEmail)
  if (!email) return { ok: false, error: "An email is required." }
  if (isOwner(email)) return { ok: false, error: "The owner always has lock rights and can't be revoked." }
  const isLocker = input.lockers.map(normalizeEmail).includes(email)
  if (input.action === "grant") {
    if (!input.admins.map(normalizeEmail).includes(email)) return { ok: false, error: "Only admins can be given lock rights." }
    if (isLocker) return { ok: false, error: "That admin already has lock rights." }
  } else if (!isLocker) {
    return { ok: false, error: "That admin doesn't have lock rights." }
  }
  return { ok: true, email }
}

export function assertAdmin<T extends NonNullable<Viewer>>(viewer: T | null | undefined): T {
  if (!viewer || viewer.role !== "admin") throw new AuthorizationError()
  return viewer
}

export type GateDecision = { action: "allow" } | { action: "redirect"; to: string } | { action: "deny"; status: 401 | 403 }

/**
 * Proxy decision for /admin requests. Page visits are redirected; anything
 * else (server action POSTs) is refused outright, since a redirect would only
 * hand the action caller an HTML page.
 */
export function adminGateDecision(viewer: Viewer, req: { method: string; pathname: string }): GateDecision {
  const isPageVisit = req.method === "GET" || req.method === "HEAD"
  if (!viewer) {
    return isPageVisit
      ? { action: "redirect", to: `/sign-in?redirect=${encodeURIComponent(req.pathname)}` }
      : { action: "deny", status: 401 }
  }
  if (viewer.role !== "admin") return isPageVisit ? { action: "redirect", to: "/" } : { action: "deny", status: 403 }
  return { action: "allow" }
}
