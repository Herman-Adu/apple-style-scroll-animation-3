// Domain layer: entities and the port (interface) every backend adapter must satisfy.
// UI and application code depend only on these types, never on a concrete backend.

export type OnboardingStatus = "pending" | "complete"

export interface User {
  id: string
  email: string
  name: string
  /** Free-form profile fields collected during onboarding. */
  profile: UserProfile
  onboardingStatus: OnboardingStatus
  createdAt: string
}

export interface UserProfile {
  /** How the user wants to be addressed. */
  displayName?: string
  /** Avatar image source — an uploaded data URL (local) or a hosted URL (Strapi). */
  avatarUrl?: string
  /** Primary reason the user is here — drives personalization. */
  goal?: string
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
