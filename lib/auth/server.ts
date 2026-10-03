import "server-only"
import { cache } from "react"
import { cookies, headers } from "next/headers"
import { auth } from "@/lib/auth/instance"
import { authConfig, effectiveRole, isOwner } from "./config"
import { assertAdmin, blockLockerEmails, canLockBlocks, mergeLockers } from "./permissions"
import { listGrantedLockerEmails } from "./lock-rights-repo"
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
  return readSession(await headers(), (await cookies()).get(SESSION_COOKIE)?.value)
}

/** The same session check, for the proxy, which has the request rather than next/headers. */
export async function getRequestSession(request: Request & { cookies: { get(name: string): { value: string } | undefined } }) {
  return readSession(request.headers, request.cookies.get(SESSION_COOKIE)?.value)
}

async function readSession(requestHeaders: Headers, legacyToken: string | undefined): Promise<SessionPayload | null> {
  if (authConfig.provider === "db") {
    const session = await auth.api.getSession({ headers: requestHeaders })
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

  if (!legacyToken) return null
  return verifySession(legacyToken)
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

/** The verified admin session, or throws AuthorizationError. Call first in every admin server action. */
export async function requireAdmin(): Promise<SessionPayload> {
  return assertAdmin(await getServerSession())
}

/** Whether the current viewer may lock/unlock email blocks (owner or EMAIL_BLOCK_LOCKERS). */
export const getServerCanLockBlocks = cache(async (): Promise<boolean> => {
  const session = await getServerSession()
  if (!session || session.role !== "admin") return false
  if (isOwner(session.email)) return true
  return canLockBlocks(session, mergeLockers(await listGrantedLockerEmails(), blockLockerEmails()))
})

/**
 * Whether the current server-side viewer is the platform owner (super-admin).
 * Trusts the verified session email against the owner allowlist — this is the
 * authorization seam that decides whether owner-only doc bodies are serialized.
 */
export async function getServerIsOwner(): Promise<boolean> {
  const session = await getServerSession()
  return isOwner(session?.email)
}
