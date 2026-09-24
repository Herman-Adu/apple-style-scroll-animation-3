// Domain layer: entities and the port (interface) every backend adapter must satisfy.
// UI and application code depend only on these types, never on a concrete backend.

export type OnboardingStatus = "pending" | "complete"

/**
 * Access role. In local mode it's resolved from an email allowlist; once Strapi
 * is connected it maps to the users-permissions role. The admin area gates on
 * `admin`.
 */
export type UserRole = "admin" | "customer"

/** Account standing. Blocked accounts are refused at sign-in and ejected on reload. */
export type UserStatus = "active" | "blocked"

/**
 * A personal offer tag an admin attaches to a customer. This is a *label* for the
 * team — Stripe still enforces the real discount at checkout. `value` is the
 * percent (for `percent`) or a free amount is implied (for `shipping`); `custom`
 * is a free-form label.
 */
export interface OfferTag {
  id: string
  label: string
  kind: "percent" | "shipping" | "custom"
  /** Percent amount for `percent` offers. Ignored for other kinds. */
  value?: number
  note?: string
  createdAt: string
  /**
   * ISO timestamp after which the offer no longer applies. Missing → never
   * expires. Enforced by the checkout pricing engine, so an expired offer can
   * never discount an order.
   */
  expiresAt?: string
  /** ISO timestamp of the most recent order that used this offer. Record-only. */
  redeemedAt?: string
  /** How many orders have used this offer. Missing → 0. Record-only. */
  redemptionCount?: number
  /**
   * ISO timestamp of the last time the branded offer email was sent to the
   * customer for this offer. Missing → never emailed. Drives the "sent →
   * redeemed" conversion reporting in admin analytics.
   */
  notifiedAt?: string
}

export interface User {
  id: string
  email: string
  name: string
  /** Access role — drives admin-area authorization. */
  role: UserRole
  /** Free-form profile fields collected during onboarding. */
  profile: UserProfile
  onboardingStatus: OnboardingStatus
  createdAt: string
  /** Account standing. Missing on legacy records → treated as "active". */
  status?: UserStatus
  /**
   * Explicit admin role override. When set it wins over the email-allowlist
   * derivation, so an admin can promote/demote without editing env config.
   */
  roleOverride?: UserRole
  /** Personal offer tags managed by admins. Missing → treated as []. */
  offers?: OfferTag[]
}

export interface UserProfile {
  /** How the user wants to be addressed. */
  displayName?: string
  /** Avatar image source — an uploaded data URL (local) or a hosted URL (Strapi). */
  avatarUrl?: string
  /** Reasons the user is here — drives personalization. Multi-select. */
  goals: string[]
  /** Product interests selected during onboarding. */
  interests: string[]
  /** Marketing / product update opt-in. */
  newsletter: boolean
  /** Optional short bio. */
  bio?: string
}

export interface Session {
  user: User
  /** Opaque token persisted by the adapter (JWT for Strapi, uuid for local). */
  token: string
}

export interface SignUpInput {
  email: string
  password: string
  name: string
}

export interface SignInInput {
  email: string
  password: string
}

/** Partial profile patch applied during onboarding or from the account page. */
export type ProfileUpdate = Partial<UserProfile>

/**
 * Port: the contract every backend must implement.
 * Swapping backends means providing a new implementation of this interface —
 * nothing in the UI or application layer changes.
 */
export interface AuthAdapter {
  /** Restore a session from persisted storage on app load. Returns null when signed out. */
  getSession(): Promise<Session | null>
  signUp(input: SignUpInput): Promise<Session>
  signIn(input: SignInInput): Promise<Session>
  signOut(): Promise<void>
  /** Persist profile changes and return the updated user. */
  updateProfile(update: ProfileUpdate): Promise<User>
  /** Mark onboarding finished and return the updated user. */
  completeOnboarding(update: ProfileUpdate): Promise<User>

  // --- Admin-only management methods ---
  // These power the admin Customers area. The application layer stays
  // backend-agnostic: swapping adapters swaps the implementation, not callers.

  /** List every account (admin only). */
  listUsers(): Promise<User[]>
  /** Block or unblock an account. */
  setUserStatus(id: string, status: UserStatus): Promise<User>
  /** Promote/demote via an explicit role override. */
  setUserRole(id: string, role: UserRole): Promise<User>
  /** Toggle a customer's newsletter opt-in. */
  setUserNewsletter(id: string, newsletter: boolean): Promise<User>
  /** Replace a customer's personal offer tags. */
  setUserOffers(id: string, offers: OfferTag[]): Promise<User>
  /**
   * Record that the given offers were redeemed on an order: stamps `redeemedAt`
   * and increments `redemptionCount`. Called at checkout by the customer's own
   * session. Record-only — it never disables the offer (expiry does that).
   */
  markOffersRedeemed(userId: string, offerIds: string[]): Promise<User>
}

/** Raised by adapters for expected auth failures so the UI can show friendly copy. */
export class AuthError extends Error {
  constructor(
    message: string,
    public code:
      | "invalid_credentials"
      | "email_taken"
      | "unauthenticated"
      | "network"
      | "unknown" = "unknown",
  ) {
    super(message)
    this.name = "AuthError"
  }
}
