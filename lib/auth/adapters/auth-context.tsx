"use client"

// Application layer: exposes auth state + actions to the UI via a hook.
// Depends only on the AuthAdapter port — never on a concrete backend.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { getAuthAdapter } from "../adapters"
import {
  AuthError,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
} from "../domain/types"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  signUp: (input: SignUpInput) => Promise<User>
  signIn: (input: SignInInput) => Promise<User>
  signOut: () => Promise<void>
  updateProfile: (update: ProfileUpdate) => Promise<User>
  completeOnboarding: (update: ProfileUpdate) => Promise<User>
  /** Record that offers were used on an order and refresh the local session. */
  redeemOffers: (offerIds: string[]) => Promise<void>
  /** Close an offer's card on the account page and refresh the local session. */
  dismissOffer: (offerId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Cross-tab broadcast key. Sign-out only clears the session cookie for the
 * tab that triggered it — a second tab left open on /admin or /account has no
 * other way to learn the session is gone, so without this it keeps rendering
 * as signed in (and RouteGuard/AdminGuard never re-run) until it's reloaded.
 * Writing this key on every auth-state change fires a `storage` event in
 * every OTHER tab on the same origin, which re-fetches the session there too.
 */
const AUTH_BROADCAST_KEY = "momo.auth.broadcast"

function broadcastAuthChange() {
  try {
    window.localStorage.setItem(AUTH_BROADCAST_KEY, String(Date.now()))
  } catch {
    // Best-effort only (e.g. storage disabled) — the tab that performed the
    // action is still correct; only cross-tab sync is skipped.
  }
}

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode
  /**
   * Session resolved on the server for the initial render. When provided, the
   * header renders the correct auth state on first paint — no "loading" flash
   * and no signed-out flicker after a hard navigation (which remounts this
   * provider). `null` means the server confirmed no session; `undefined` means
   * it wasn't seeded, so we fall back to fetching client-side.
   */
  initialSession?: Session | null
}) {
  const adapter = useMemo(() => getAuthAdapter(), [])
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [status, setStatus] = useState<AuthStatus>(
    initialSession !== undefined
      ? initialSession
        ? "authenticated"
        : "unauthenticated"
      : "loading",
  )

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
        // Keep any server-seeded session on a transient refresh failure;
        // only fall back to unauthenticated when we had nothing to begin with.
        setStatus((prev) => (prev === "loading" ? "unauthenticated" : prev))
      })
    return () => {
      active = false
    }
  }, [adapter])

  // Re-sync with the server session whenever another tab signs in/out (via the
  // storage broadcast below) or this tab regains focus. Without this, a tab
  // left open on a guarded page never learns its session was cleared elsewhere
  // and keeps rendering as signed in — RouteGuard/AdminGuard only react to
  // `status`, and nothing was updating it.
  useEffect(() => {
    let active = true
    const resync = () => {
      adapter
        .getSession()
        .then((s) => {
          if (!active) return
          setSession(s)
          setStatus(s ? "authenticated" : "unauthenticated")
        })
        .catch(() => {
          // Transient failure — leave the current state as-is rather than
          // signing the user out on a flaky request.
        })
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_BROADCAST_KEY) resync()
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") resync()
    }
    window.addEventListener("storage", onStorage)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onVisibility)
    return () => {
      active = false
      window.removeEventListener("storage", onStorage)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onVisibility)
    }
  }, [adapter])

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const s = await adapter.signUp(input)
      setSession(s)
      setStatus("authenticated")
      broadcastAuthChange()
      return s.user
    },
    [adapter],
  )

  const signIn = useCallback(
    async (input: SignInInput) => {
      const s = await adapter.signIn(input)
      setSession(s)
      setStatus("authenticated")
      broadcastAuthChange()
      return s.user
    },
    [adapter],
  )

  const signOut = useCallback(async () => {
    await adapter.signOut()
    setSession(null)
    setStatus("unauthenticated")
    broadcastAuthChange()
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

  const redeemOffers = useCallback(
    async (offerIds: string[]) => {
      const current = session?.user
      if (!current || offerIds.length === 0) return
      try {
        applyUser(await adapter.markOffersRedeemed(current.id, offerIds))
      } catch {
        // Redemption tracking is record-only; never block the order flow on it.
      }
    },
    [adapter, applyUser, session],
  )

  const dismissOffer = useCallback(
    async (offerId: string) => {
      const current = session?.user
      if (!current) return
      applyUser(await adapter.dismissOffer(current.id, offerId))
    },
    [adapter, applyUser, session],
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
      redeemOffers,
      dismissOffer,
    }),
    [status, session, signUp, signIn, signOut, updateProfile, completeOnboarding, redeemOffers],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}

export { AuthError }
