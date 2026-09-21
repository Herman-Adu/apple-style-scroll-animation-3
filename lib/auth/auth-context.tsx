"use client"

// Application layer: exposes auth state + actions to the UI via a hook.
// Depends only on the AuthAdapter port — never on a concrete backend.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getAuthAdapter } from "./adapters"
import {
  AuthError,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
} from "./types"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  signUp: (input: SignUpInput) => Promise<User>
  signIn: (input: SignInInput) => Promise<User>
  signOut: () => Promise<void>
  updateProfile: (update: ProfileUpdate) => Promise<User>
  completeOnboarding: (update: ProfileUpdate) => Promise<User>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const adapter = useMemo(() => getAuthAdapter(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>("loading")

  useEffect(() => {
    let active = true
    adapter
      .getSession()
      .then((s) => {
        if (!active) return
        setSession(s)
        setStatus(s ? "authenticated" : "unauthenticated")
      })
      .catch(() => {
        if (!active) return
        setStatus("unauthenticated")
      })
    return () => {
      active = false
    }
  }, [adapter])

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const s = await adapter.signUp(input)
      setSession(s)
      setStatus("authenticated")
      return s.user
    },
    [adapter],
  )

  const signIn = useCallback(
    async (input: SignInInput) => {
      const s = await adapter.signIn(input)
      setSession(s)
      setStatus("authenticated")
      return s.user
    },
    [adapter],
  )

  const signOut = useCallback(async () => {
    await adapter.signOut()
    setSession(null)
    setStatus("unauthenticated")
  }, [adapter])

  const applyUser = useCallback((user: User) => {
    setSession((prev) => (prev ? { ...prev, user } : prev))
    return user
  }, [])

  const updateProfile = useCallback(
    async (update: ProfileUpdate) => applyUser(await adapter.updateProfile(update)),
    [adapter, applyUser],
  )

  const completeOnboarding = useCallback(
    async (update: ProfileUpdate) => applyUser(await adapter.completeOnboarding(update)),
    [adapter, applyUser],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      signUp,
      signIn,
      signOut,
      updateProfile,
      completeOnboarding,
    }),
    [status, session, signUp, signIn, signOut, updateProfile, completeOnboarding],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export { AuthError }
