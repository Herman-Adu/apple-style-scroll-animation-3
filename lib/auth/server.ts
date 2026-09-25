import "server-only"
import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth"
import { authConfig, effectiveRole } from "./config"
import { SESSION_COOKIE } from "./session-cookie"
import { verifySession, type SessionPayload } from "./session-token"
import type { UserRole } from "./types"

/**
 * The verified server-side session. In "db" mode this is the Better Auth
 * session (the permanent identity backend), with the role read from the user
 * row so an admin promotion takes effect on the next request. In the legacy
 * local/strapi modes it is the httpOnly, HMAC-signed cookie minted by
 * establishSession(). Returns null when signed out, blocked, or the cookie is
 * missing, tampered with, or expired.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  if (authConfig.provider === "db") {
    const session = await auth.api.getSession({ headers: await headers() })
    const user = session?.user as
      | { id: string; email: string; name: string; role?: string; status?: string; roleOverride?: string }
      | undefined
    if (!user) return null
    // An account blocked after sign-in is treated as signed out on the server.
    if (user.status === "blocked") return null
    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: effectiveRole(user),
      exp: session?.session?.expiresAt
        ? new Date(session.session.expiresAt).getTime()
        : Date.now() + 60 * 60 * 1000,
    }
  }

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
