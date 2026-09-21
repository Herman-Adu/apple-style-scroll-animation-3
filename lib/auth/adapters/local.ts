// Infrastructure adapter: browser-only reference backend.
// Persists users + session in localStorage so the full flow is usable in preview
// with zero backend. Mirrors the exact AuthAdapter contract the Strapi adapter uses,
// so the application layer cannot tell them apart.

import { authConfig } from "../config"
import {
  AuthAdapter,
  AuthError,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
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

function stripPassword(user: StoredUser): User {
  const { password: _password, ...safe } = user
  return safe
}

function emptyProfile() {
  return { interests: [], newsletter: false }
}

/** Simulated latency so loading states behave like a real network. */
const tick = () => new Promise((r) => setTimeout(r, 400))

export function createLocalAdapter(): AuthAdapter {
  return {
    async getSession() {
      const token = readToken()
      if (!token) return null
      const user = readUsers().find((u) => u.id === token)
      if (!user) return null
      return { user: stripPassword(user), token }
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
        password: input.password,
        profile: emptyProfile(),
        onboardingStatus: "pending",
        createdAt: new Date().toISOString(),
      }
      users.push(user)
      writeUsers(users)
      writeToken(user.id)
      return { user: stripPassword(user), token: user.id }
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
      return { user: stripPassword(user), token: user.id }
    },

    async signOut() {
      writeToken(null)
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
