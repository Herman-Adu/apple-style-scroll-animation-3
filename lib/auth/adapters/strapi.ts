// Infrastructure adapter: real Strapi REST backend.
// Implements the same AuthAdapter port as the local adapter. To go live, set
// NEXT_PUBLIC_AUTH_PROVIDER=strapi and NEXT_PUBLIC_API_URL to your Strapi URL.
//
// Assumes Strapi's Users & Permissions plugin (/api/auth/local, /api/users/me)
// plus custom `profile`, `onboardingStatus` fields on the user model. Adjust the
// mapping helpers below to match your exact content-type — that is the only place
// backend-specific shape lives.

import { authConfig, resolveRole } from "../config"
import { clearSession, establishSession } from "../actions"
import {
  AuthAdapter,
  AuthError,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
  UserProfile,
} from "../types"

function readToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(authConfig.storageKey)
}

function writeToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) window.localStorage.setItem(authConfig.storageKey, token)
  else window.localStorage.removeItem(authConfig.storageKey)
}

/** Maps a raw Strapi user record to our domain User. Adjust to your content-type. */
function toUser(raw: any): User {
  const profile: UserProfile = {
    displayName: raw.profile?.displayName ?? raw.username,
    // Prefer an explicit profile URL, falling back to a Strapi media relation.
    avatarUrl: raw.profile?.avatarUrl ?? raw.avatar?.url,
    goals: Array.isArray(raw.profile?.goals)
      ? raw.profile.goals
      : raw.profile?.goal
        ? [raw.profile.goal]
        : [],
    interests: raw.profile?.interests ?? [],
    newsletter: raw.profile?.newsletter ?? false,
    bio: raw.profile?.bio,
  }
  // Prefer Strapi's users-permissions role name; fall back to the local
  // allowlist so admin bootstrapping keeps working before roles are configured.
  const strapiRole = String(raw.role?.name ?? raw.role?.type ?? "").toLowerCase()
  const role = strapiRole === "admin" ? "admin" : resolveRole(raw.email ?? "")
  return {
    id: String(raw.id),
    email: raw.email,
    name: raw.name ?? raw.username ?? raw.email,
    role,
    profile,
    onboardingStatus: raw.onboardingStatus ?? "pending",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

async function api<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  if (!authConfig.apiUrl) {
    throw new AuthError("NEXT_PUBLIC_API_URL is not configured.", "network")
  }
  let res: Response
  try {
    res = await fetch(`${authConfig.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new AuthError("Could not reach the server.", "network")
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AuthError("Your session has expired. Please sign in again.", "unauthenticated")
    }
    const body = await res.json().catch(() => null)
    const message: string = body?.error?.message ?? "Something went wrong."
    if (/email|taken|already/i.test(message)) throw new AuthError(message, "email_taken")
    if (/invalid|password|identifier/i.test(message)) {
      throw new AuthError("Incorrect email or password.", "invalid_credentials")
    }
    throw new AuthError(message, "unknown")
  }
  return res.json() as Promise<T>
}

export function createStrapiAdapter(): AuthAdapter {
  return {
    async getSession(): Promise<Session | null> {
      const token = readToken()
      if (!token) {
        await clearSession()
        return null
      }
      try {
        const raw = await api<any>("/api/users/me?populate=*", { method: "GET" }, token)
        const user = toUser(raw)
        // Hand the JWT to the server action, which re-verifies it against Strapi
        // and derives the trusted role from that verified response.
        await establishSession({ id: user.id, email: user.email, name: user.name, strapiJwt: token })
        return { user, token }
      } catch {
        writeToken(null)
        await clearSession()
        return null
      }
    },

    async signUp(input: SignUpInput): Promise<Session> {
      const data = await api<{ jwt: string; user: any }>("/api/auth/local/register", {
        method: "POST",
        body: JSON.stringify({
          username: input.email,
          email: input.email,
          password: input.password,
          name: input.name,
        }),
      })
      writeToken(data.jwt)
      const user = toUser(data.user)
      await establishSession({ id: user.id, email: user.email, name: user.name, strapiJwt: data.jwt })
      return { user, token: data.jwt }
    },

    async signIn(input: SignInInput): Promise<Session> {
      const data = await api<{ jwt: string; user: any }>("/api/auth/local", {
        method: "POST",
        body: JSON.stringify({ identifier: input.email, password: input.password }),
      })
      writeToken(data.jwt)
      const user = toUser(data.user)
      await establishSession({ id: user.id, email: user.email, name: user.name, strapiJwt: data.jwt })
      return { user, token: data.jwt }
    },

    async signOut() {
      writeToken(null)
      await clearSession()
    },

    async updateProfile(update: ProfileUpdate): Promise<User> {
      const token = readToken()
      if (!token) throw new AuthError("Not signed in.", "unauthenticated")
      const me = await api<any>("/api/users/me", { method: "GET" }, token)
      const raw = await api<any>(
        `/api/users/${me.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ profile: { ...me.profile, ...update } }),
        },
        token,
      )
      return toUser(raw)
    },

    async completeOnboarding(update: ProfileUpdate): Promise<User> {
      const token = readToken()
      if (!token) throw new AuthError("Not signed in.", "unauthenticated")
      const me = await api<any>("/api/users/me", { method: "GET" }, token)
      const raw = await api<any>(
        `/api/users/${me.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            profile: { ...me.profile, ...update },
            onboardingStatus: "complete",
          }),
        },
        token,
      )
      return toUser(raw)
    },
  }
}
