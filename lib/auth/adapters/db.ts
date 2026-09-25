// Infrastructure adapter: Better Auth + Neon Postgres backend.
//
// Identity (signUp/signIn/signOut) is delegated to the Better Auth client, which
// owns password hashing and the httpOnly session cookie. Everything else —
// reading the enriched session, profile edits, and all admin management — goes
// through server actions that re-derive identity from the cookie server-side.
// The client never holds or forges a role: this adapter cannot even express it.
//
// Satisfies the exact AuthAdapter contract the local/strapi adapters satisfy, so
// the application layer and UI cannot tell the backend changed.

import { authClient } from "@/lib/auth-client"
import {
  completeOnboardingAction,
  fetchAppSession,
  listUsersAction,
  markOffersRedeemedAction,
  setUserNewsletterAction,
  setUserOffersAction,
  setUserRoleAction,
  setUserStatusAction,
  updateProfileAction,
} from "../db-actions"
import {
  AuthAdapter,
  AuthError,
  OfferTag,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
  UserRole,
  UserStatus,
} from "../types"

/** Map a Better Auth client error to the app's friendly AuthError. */
function toAuthError(error: { code?: string; message?: string } | null): AuthError {
  const code = error?.code ?? ""
  if (code === "USER_ALREADY_EXISTS" || code === "USER_EMAIL_ALREADY_EXISTS") {
    return new AuthError("An account with this email already exists.", "email_taken")
  }
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_PASSWORD") {
    return new AuthError("Incorrect email or password.", "invalid_credentials")
  }
  return new AuthError(error?.message || "Something went wrong. Please try again.", "unknown")
}

async function requireSession(): Promise<Session> {
  const session = await fetchAppSession()
  if (!session) {
    throw new AuthError("Your session could not be established. Please sign in again.", "network")
  }
  return session
}

export function createDbAdapter(): AuthAdapter {
  return {
    async getSession(): Promise<Session | null> {
      return fetchAppSession()
    },

    async signUp(input: SignUpInput): Promise<Session> {
      const { error } = await authClient.signUp.email({
        email: input.email,
        password: input.password,
        name: input.name,
      })
      if (error) throw toAuthError(error)
      // autoSignIn is on, so the session cookie is already set; read the
      // enriched app user (role resolved server-side, profile, offers).
      return requireSession()
    },

    async signIn(input: SignInInput): Promise<Session> {
      const { error } = await authClient.signIn.email({
        email: input.email,
        password: input.password,
      })
      if (error) throw toAuthError(error)
      const session = await fetchAppSession()
      if (!session) {
        // Sign-in succeeded but no active session — the account is blocked
        // (fetchAppSession ejects blocked users) or the cookie was rejected.
        await authClient.signOut().catch(() => {})
        throw new AuthError("This account has been suspended.", "invalid_credentials")
      }
      return session
    },

    async signOut(): Promise<void> {
      await authClient.signOut().catch(() => {})
    },

    async updateProfile(update: ProfileUpdate): Promise<User> {
      return updateProfileAction(update)
    },

    async completeOnboarding(update: ProfileUpdate): Promise<User> {
      return completeOnboardingAction(update)
    },

    async listUsers(): Promise<User[]> {
      return listUsersAction()
    },

    async setUserStatus(id: string, status: UserStatus): Promise<User> {
      return setUserStatusAction(id, status)
    },

    async setUserRole(id: string, role: UserRole): Promise<User> {
      return setUserRoleAction(id, role)
    },

    async setUserNewsletter(id: string, newsletter: boolean): Promise<User> {
      return setUserNewsletterAction(id, newsletter)
    },

    async setUserOffers(id: string, offers: OfferTag[]): Promise<User> {
      return setUserOffersAction(id, offers)
    },

    async markOffersRedeemed(_userId: string, offerIds: string[]): Promise<User> {
      // The server action ignores the passed id and acts on the session user.
      return markOffersRedeemedAction(offerIds)
    },
  }
}
