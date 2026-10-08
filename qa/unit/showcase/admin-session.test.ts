import { describe, expect, it } from "vitest"
import { adminCredentials, adminCredentialsFromEnv, canSignInOnCamera } from "../../showcase/admin-session"
import { DEMO_ADMIN } from "../../../scripts/lib/showcase-admin.mjs"

/**
 * The journey clip types a password into the sign-in form on camera. These pin the
 * rule that makes that safe: only the throwaway demo admin seeded for a recording
 * may ever be typed in. Everyone else signs in off camera, on a page that is
 * closed before the take continues.
 */
describe("canSignInOnCamera", () => {
  it("lets the seeded demo admin sign in on camera", () => {
    expect(canSignInOnCamera({ email: DEMO_ADMIN.email, password: "whatever" })).toBe(true)
  })

  it("refuses a real admin address, however it was supplied", () => {
    expect(canSignInOnCamera({ email: "owner@example.com", password: "whatever" })).toBe(false)
  })

  it("refuses when there are no credentials at all", () => {
    expect(canSignInOnCamera(null)).toBe(false)
  })
})

/** ProcessEnv insists on NODE_ENV; these tests only care about the two keys. */
const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv

describe("adminCredentials", () => {
  it("takes the address and password from the environment first", () => {
    expect(adminCredentialsFromEnv(env({ QA_ADMIN_EMAIL: "someone@example.com", QA_ADMIN_PASSWORD: "secret" }))).toEqual({ email: "someone@example.com", password: "secret" })
  })

  it("needs both halves, so a stray address alone is not credentials", () => {
    expect(adminCredentialsFromEnv(env({ QA_ADMIN_EMAIL: "someone@example.com" }))).toBeNull()
  })

  it("falls back to the file the seed writes", () => {
    const seeded = JSON.stringify({ email: DEMO_ADMIN.email, password: "seeded" })
    expect(adminCredentials(env({}), () => seeded)).toEqual({
      email: DEMO_ADMIN.email,
      password: "seeded",
    })
  })

  it("is null when neither the environment nor the seed has anything", () => {
    expect(adminCredentials(env({}), () => null)).toBeNull()
  })
})
