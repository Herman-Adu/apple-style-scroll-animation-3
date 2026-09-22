// Infrastructure adapter: browser-only reference backend.
// Persists users + session in localStorage so the full flow is usable in preview
// with zero backend. Mirrors the exact AuthAdapter contract the Strapi adapter uses,
// so the application layer cannot tell them apart.

import { authConfig, resolveRole } from "../config"
import { writeRoleCookie } from "../session-cookie"
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

const USERS_KEY = "momo.auth.users"

interface StoredUser extends User {
  password: string
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]")
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(authConfig.storageKey)
}

function writeToken(token: string | null) {
  if (token) window.localStorage.setItem(authConfig.storageKey, token)
  else window.localStorage.removeItem(authConfig.storageKey)
}

// Coerces persisted profiles to the current shape. Notably migrates the legacy
// single `goal` string to the `goals` array so accounts created before the
// multi-select change keep their selection.
function normalizeProfile(profile: Record<string, unknown>): UserProfile {
  const legacyGoal = typeof profile.goal === "string" ? profile.goal : undefined
  const goals = Array.isArray(profile.goals)
    ? (profile.goals as string[])
    : legacyGoal
      ? [legacyGoal]
      : []
  return {
    displayName: profile.displayName as string | undefined,
    avatarUrl: profile.avatarUrl as string | undefined,
    goals,
    interests: Array.isArray(profile.interests) ? (profile.interests as string[]) : [],
    newsletter: Boolean(profile.newsletter),
    bio: profile.bio as string | undefined,
  }
}

function stripPassword(user: StoredUser): User {
  const { password: _password, ...safe } = user
  // Role is always derived from the current allowlist, so promoting/demoting an
  // email takes effect on next read without rewriting stored records.
  return {
    ...safe,
    role: resolveRole(safe.email),
    profile: normalizeProfile(safe.profile as unknown as Record<string, unknown>),
  }
}

function emptyProfile(): UserProfile {
  return { goals: [], interests: [], newsletter: false }
}

/** Simulated latency so loading states behave like a real network. */
const tick = () => new Promise((r) => setTimeout(r, 400))

export function createLocalAdapter(): AuthAdapter {
  return {
    async getSession() {
      const token = readToken()
      if (!token) {
        writeRoleCookie(null)
        return null
      }
      const user = readUsers().find((u) => u.id === token)
      if (!user) {
        writeRoleCookie(null)
        return null
      }
      const safe = stripPassword(user)
      // Keep the server-readable role cookie in sync on every load, so accounts
      // created before this cookie existed self-heal on their next visit.
      writeRoleCookie(safe.role)
      return { user: safe, token }
    },

    async signUp(input: SignUpInput): Promise<Session> {
      await tick()
      const users = readUsers()
      if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
        throw new AuthError("An account with this email already exists.", "email_taken")
      }
      const user: StoredUser = {
        id: crypto.randomUUID(),
        email: input.email,
        name: input.name,
        role: resolveRole(input.email),
        password: input.password,
        profile: emptyProfile(),
        onboardingStatus: "pending",
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      writeUsers(users)
      writeToken(user.id)
      const safe = stripPassword(user)
      writeRoleCookie(safe.role)
      return { user: safe, token: user.id }
    },

    async signIn(input: SignInInput): Promise<Session> {
      await tick()
      const user = readUsers().find(
        (u) => u.email.toLowerCase() === input.email.toLowerCase(),
      )
      if (!user || user.password !== input.password) {
        throw new AuthError("Incorrect email or password.", "invalid_credentials")
      }
      writeToken(user.id)
      const safe = stripPassword(user)
      writeRoleCookie(safe.role)
      return { user: safe, token: user.id }
    },

    async signOut() {
      writeToken(null)
      writeRoleCookie(null)
    },

    async updateProfile(update: ProfileUpdate): Promise<User> {
      const token = readToken()
      const users = readUsers()
      const idx = users.findIndex((u) => u.id === token)
      if (idx === -1) throw new AuthError("Not signed in.", "unauthenticated")
      users[idx] = {
        ...users[idx],
        profile: { ...users[idx].profile, ...update },
      }
      writeUsers(users)
      return stripPassword(users[idx])
    },

    async completeOnboarding(update: ProfileUpdate): Promise<User> {
      const token = readToken()
      const users = readUsers()
      const idx = users.findIndex((u) => u.id === token)
      if (idx === -1) throw new AuthError("Not signed in.", "unauthenticated")
      users[idx] = {
        ...users[idx],
        profile: { ...users[idx].profile, ...update },
        onboardingStatus: "complete",
      }
      writeUsers(users)
      return stripPassword(users[idx])
    },
  }
}
