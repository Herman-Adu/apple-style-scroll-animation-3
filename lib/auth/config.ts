// Configuration layer: selects which backend adapter is active.
// Flip the provider with a single env var — no code changes required.

import type { UserRole } from "./types"

export type AuthProviderName = "local" | "strapi" | "db"

export const authConfig = {
  /**
   * Which adapter to use. Defaults to "db" (Better Auth + Neon Postgres), the
   * permanent identity backend. Set NEXT_PUBLIC_AUTH_PROVIDER=local for the
   * zero-backend localStorage reference, or =strapi for the legacy REST path.
   */
  provider: (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProviderName) || "db",

  /** Base URL of the Strapi (or any REST) backend, e.g. https://api.example.com */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",

  /**
   * Server-only Strapi API token used for reading published docs content. Never
   * exposed to the client (no NEXT_PUBLIC_ prefix). Optional: public docs can be
   * read without it if the Strapi "find" permission is open to the public role.
   */
  strapiToken: process.env.STRAPI_API_TOKEN || "",

  /** Key used to persist the session token in the browser. */
  storageKey: "momo.auth.session",
} as const

/** True when the Strapi backend is selected and a base URL is configured. */
export function isStrapiConfigured(): boolean {
  return authConfig.provider === "strapi" && Boolean(authConfig.apiUrl)
}

/**
 * Admin bootstrap for local mode (pre-Strapi). Any account whose email is on
 * this allowlist is treated as an admin. Override with a comma-separated
 * NEXT_PUBLIC_ADMIN_EMAILS. Once Strapi is connected, the role comes from the
 * users-permissions role and this list is ignored.
 */
export const adminEmails: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "herman@adudev.co.uk,admin@adudev.co.uk"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

/** Resolve a role from an email against the local admin allowlist. */
export function resolveRole(email: string): UserRole {
  return adminEmails.includes(email.trim().toLowerCase()) ? "admin" : "customer"
}

/**
 * The effective role for a user row/session. An explicit admin override wins;
 * otherwise a stored role wins; otherwise it's derived from the email allowlist.
 * This is the single place role precedence is decided, shared by the DB adapter
 * (client-facing shape) and the server authorization seam.
 */
export function effectiveRole(u: {
  email: string
  role?: string | null
  roleOverride?: string | null
}): UserRole {
  if (u.roleOverride === "admin" || u.roleOverride === "customer") return u.roleOverride
  if (u.role === "admin" || u.role === "customer") return u.role
  return resolveRole(u.email)
}
