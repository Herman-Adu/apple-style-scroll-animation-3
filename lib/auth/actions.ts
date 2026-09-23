"use server"

// Server Actions that own the httpOnly session cookie. The browser adapters call
// these after verifying credentials; the cookie is written server-side, so its
// contents (crucially, the role) cannot be read or forged from client JavaScript.
//
// The role is resolved HERE, on the server — never accepted from the client.
//
// Two trust modes:
//  - Strapi mode: the client hands us its Strapi JWT. We verify that token
//    against Strapi's /api/users/me server-side and derive identity + role from
//    the verified response, ignoring the client-provided fields entirely. A
//    supplied-but-invalid token is rejected rather than silently downgraded.
//  - Local/demo mode: no JWT is present, so identity comes from the adapter and
//    role from the email allowlist. Password verification still happens in the
//    local adapter, so demo mode remains a UX gate rather than a hard boundary.

import { cookies } from "next/headers"
import { resolveRole } from "./config"
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./session-cookie"
import { signSession } from "./session-token"
import { verifyStrapiToken } from "./strapi-verify"
import type { UserRole } from "./types"

export interface EstablishSessionInput {
  id: string
  email: string
  name: string
  /**
   * The Strapi JWT from a successful login. When present, identity + role are
   * verified against Strapi server-side and the fields above are treated as
   * untrusted hints only.
   */
  strapiJwt?: string
}

/**
 * Mint an httpOnly, signed session cookie for the given identity. Returns the
 * server-resolved role so the client can keep its in-memory state in sync without
 * being the source of truth for authorization.
 */
export async function establishSession(input: EstablishSessionInput): Promise<{ role: UserRole }> {
  let identity = {
    sub: input.id,
    email: input.email,
    name: input.name,
    role: resolveRole(input.email),
  }

  if (input.strapiJwt) {
    const verified = await verifyStrapiToken(input.strapiJwt)
    if (!verified) {
      // A token was presented but Strapi did not vouch for it. Refuse to mint a
      // session rather than fall back to trusting the client-supplied identity.
      await clearSession()
      throw new Error("Session could not be verified. Please sign in again.")
    }
    identity = { sub: verified.id, email: verified.email, name: verified.name, role: verified.role }
  }

  const token = await signSession({
    ...identity,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    // SameSite=None so the cookie is still sent inside the v0 preview's
    // cross-site iframe (preview is always https, satisfying the Secure rule).
    sameSite: "none",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  return { role: identity.role }
}

/** Clear the session cookie on sign-out. */
export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
