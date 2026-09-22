// Client-writable, server-readable session hint.
//
// Bridges the browser-only auth adapters to server components so the server can
// make authorization decisions (e.g. withholding admin-only content) without a
// backend round-trip. This is a role *hint*: in local/demo mode it is written by
// the client and is therefore forgeable — a data-minimization boundary, not a
// cryptographic one. Real enforcement arrives when Strapi issues a JWT that the
// server validates in getServerRole(). Kept intentionally tiny (role only, no PII).

import type { UserRole } from "./types"

export const ROLE_COOKIE = "momo.auth.role"
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60

// SameSite=None; Secure so the cookie is still sent when the app runs inside the
// v0 preview's cross-site iframe (preview is always https).
const ATTRS = "path=/; SameSite=None; Secure"

/** Mirror the current viewer role into a cookie the server can read (or clear it). */
export function writeRoleCookie(role: UserRole | null) {
  if (typeof document === "undefined") return
  document.cookie = role
    ? `${ROLE_COOKIE}=${role}; max-age=${MAX_AGE_SECONDS}; ${ATTRS}`
    : `${ROLE_COOKIE}=; max-age=0; ${ATTRS}`
}
