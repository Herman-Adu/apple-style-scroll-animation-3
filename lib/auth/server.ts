import "server-only"
import { cookies } from "next/headers"
import { SESSION_COOKIE } from "./session-cookie"
import { verifySession, type SessionPayload } from "./session-token"
import type { UserRole } from "./types"

/**
 * The verified server-side session, read from the httpOnly, HMAC-signed cookie
 * minted by establishSession(). Returns null when signed out or when the cookie
 * is missing, tampered with, or expired. Because the signature is checked with a
 * server-only secret, a forged or hand-edited cookie is rejected here.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

/**
 * The viewer's role as trusted by the server. This is the single authorization
 * seam for the app; when Strapi is connected, only establishSession changes and
 * every caller here keeps working unchanged.
 */
export async function getServerRole(): Promise<UserRole | null> {
  const session = await getServerSession()
  return session?.role ?? null
}
