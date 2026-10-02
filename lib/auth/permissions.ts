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
