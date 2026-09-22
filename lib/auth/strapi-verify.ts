import "server-only"
import { authConfig, resolveRole } from "./config"
import type { UserRole } from "./types"

// Server-side verification of a Strapi session. The browser hands us the JWT it
// received from /api/auth/local; we do NOT trust it. Instead we call Strapi's
// /api/users/me with that token, which only succeeds if Strapi itself considers
// the token valid, and we read identity + role straight from Strapi's response.
// This is what lets establishSession derive an unforgeable role: the client can
// present a token, but it cannot fabricate a valid /api/users/me response.

export interface VerifiedStrapiIdentity {
  id: string
  email: string
  name: string
  role: UserRole
}

/**
 * Validate a Strapi JWT against the live backend and return the verified
 * identity, or null if the token is missing/invalid/unreachable. Role is taken
 * from Strapi's users-permissions role; a non-admin role falls back to the
 * local admin allowlist so admin bootstrapping keeps working before Strapi
 * roles are configured (mirrors the adapter's toUser mapping).
 */
export async function verifyStrapiToken(jwt: string | undefined | null): Promise<VerifiedStrapiIdentity | null> {
  if (!jwt || !authConfig.apiUrl) return null
  try {
    const res = await fetch(`${authConfig.apiUrl}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    const raw = (await res.json()) as any
    if (!raw?.email) return null

    const strapiRole = String(raw.role?.name ?? raw.role?.type ?? "").toLowerCase()
    const role: UserRole = strapiRole === "admin" ? "admin" : resolveRole(raw.email)

    return {
      id: String(raw.id),
      email: raw.email,
      name: raw.name ?? raw.username ?? raw.email,
      role,
    }
  } catch {
    return null
  }
}
