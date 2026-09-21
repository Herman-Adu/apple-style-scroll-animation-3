// Configuration layer: selects which backend adapter is active.
// Flip the provider with a single env var — no code changes required.

export type AuthProviderName = "local" | "strapi"

export const authConfig = {
  /**
   * Which adapter to use. Defaults to "local" so the app works out of the box
   * in preview. Set NEXT_PUBLIC_AUTH_PROVIDER=strapi to use the Strapi backend.
   */
  provider: (process.env.NEXT_PUBLIC_AUTH_PROVIDER as AuthProviderName) || "local",

  /** Base URL of the Strapi (or any REST) backend, e.g. https://api.example.com */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",

  /** Key used to persist the session token in the browser. */
  storageKey: "momo.auth.session",
} as const
