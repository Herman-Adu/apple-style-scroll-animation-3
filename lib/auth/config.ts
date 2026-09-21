// Configuration layer: selects which backend adapter is active.
// Flip the provider with a single env var — no code changes required.

export type AuthProviderName = "local" | "strapi"

export const authConfig = {
  /**
   * Which adapter to use. Defaults to "local" so the app works out of the box
   * in preview. Set NEXT_PUBLIC_AUTH_PROVIDER=strapi to use the Strapi backend.
   */
  provider: (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProviderName) || "local",

  /** Base URL of the Strapi (or any REST) backend, e.g. https://api.example.com */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",

  /** Key used to persist the session token in the browser. */
  storageKey: "momo.auth.session",
} as const

/**
 * Admin bootstrap for local mode (pre-Strapi). Any account whose email is on
 * this allowlist is treated as an admin. Override with a comma-separated
 * NEXT_PUBLIC_ADMIN_EMAILS. Once Strapi is connected, the role comes from the
 * users-permissions role and this list is ignored.
 */
export const adminEmails: string[] = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "herman@adudev.co.uk,admin@momoaudio.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

/** Resolve a role from an email against the local admin allowlist. */
export function resolveRole(email: string): "admin" | "customer" {
  return adminEmails.includes(email.trim().toLowerCase()) ? "admin" : "customer"
}
