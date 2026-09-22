"use server"

// Server Actions that own the httpOnly session cookie. The browser adapters call
// these after verifying credentials; the cookie is written server-side, so its
// contents (crucially, the role) cannot be read or forged from client JavaScript.
//
// The role is resolved HERE, on the server, from the email — never accepted from
// the client. In local/demo mode that resolution is the email allowlist; once
// Strapi is wired, establishSession should instead validate the Strapi JWT it is
// handed and derive identity + role from the verified token (the single seam to
// change). Password verification itself still happens in the adapter today, which
// is the remaining reason demo mode is not yet a full trust boundary.

import { cookies } from "next/headers"
import { resolveRole } from "./config"
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./session-cookie"
import { signSession } from "./session-token"
import type { UserRole } from "./types"

export interface EstablishSessionInput {
  id: string
  email: string
  name: string
}

/**
 * Mint an httpOnly, signed session cookie for the given identity. Returns the
 * server-resolved role so the client can keep its in-memory state in sync without
 * being the source of truth for authorization.
 */
export async function establishSession(input: EstablishSessionInput): Promise<{ role: UserRole }> {
  const role = resolveRole(input.email)
  const token = await signSession({
    sub: input.id,
    email: input.email,
    name: input.name,
    role,
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

  return { role }
}

/** Clear the session cookie on sign-out. */
export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
