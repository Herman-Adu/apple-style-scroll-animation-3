import "server-only"
import { cookies } from "next/headers"
import { ROLE_COOKIE } from "./session-cookie"
import type { UserRole } from "./types"

/**
 * The viewer's role as seen by the server, read from the session-hint cookie the
 * auth adapters set in the browser. Returns null when signed out.
 *
 * This is the single server-side authorization seam for the app. Today it trusts
 * the client-set role cookie (see session-cookie.ts for the trust model). When
 * Strapi is connected, swap the body to read the JWT cookie and validate it
 * against the backend — every server caller keeps working unchanged.
 */
export async function getServerRole(): Promise<UserRole | null> {
  const store = await cookies()
  const value = store.get(ROLE_COOKIE)?.value
  return value === "admin" || value === "customer" ? value : null
}
