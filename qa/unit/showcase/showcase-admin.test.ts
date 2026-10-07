import { describe, expect, it } from "vitest"
import { effectiveRole } from "@/lib/auth/domain/config"
import {
  ADMIN_CREDENTIALS_FILE,
  DEMO_ADMIN,
  buildCredentialAccount,
  generateDemoPassword,
  isDemoAdminEmail,
  parseAdminCredentials,
} from "../../../scripts/lib/showcase-admin.mjs"
import { DEMO_EMAIL_DOMAIN, buildCleanupPlan, isDemoRow } from "../../../scripts/lib/showcase-demo-data.mjs"
import { adminCredentials, canSignInOnCamera } from "../../showcase/admin-session"

describe("seeded demo admin", () => {
  it("is a demo-domain user the unseed already removes", () => {
    expect(DEMO_ADMIN.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true)
    expect(isDemoRow({ id: DEMO_ADMIN.id, email: DEMO_ADMIN.email })).toBe(true)
    const userCleanup = buildCleanupPlan().find((step: { model: string }) => step.model === "user")
    expect(userCleanup, "users are cleaned up").toBeDefined()
  })

  it("has admin rights through the app's own role rule", () => {
    expect(effectiveRole(DEMO_ADMIN)).toBe("admin")
    expect(DEMO_ADMIN.emailVerified).toBe(true)
  })

  it("signs in with a Better Auth credential account tied to the user", () => {
    const account = buildCredentialAccount({ userId: DEMO_ADMIN.id, passwordHash: "hashed" })
    expect(account).toEqual({
      id: "demo_account_admin",
      accountId: DEMO_ADMIN.id,
      providerId: "credential",
      userId: DEMO_ADMIN.id,
      password: "hashed",
    })
  })

  it("generates a long random password and never a fixed one", () => {
    const first = generateDemoPassword()
    const second = generateDemoPassword()
    expect(first.length).toBeGreaterThanOrEqual(24)
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("keeps the credentials file in the git-ignored generated folder", () => {
    expect(ADMIN_CREDENTIALS_FILE).toBe(".generated/showcase-admin.json")
  })
})

describe("admin credentials for recording", () => {
  const file = JSON.stringify({ email: DEMO_ADMIN.email, password: "from-file" })

  it("parses a valid credentials file", () => {
    expect(parseAdminCredentials(file)).toEqual({ email: DEMO_ADMIN.email, password: "from-file" })
  })

  it("rejects broken or incomplete files", () => {
    expect(parseAdminCredentials("not json")).toBeNull()
    expect(parseAdminCredentials(JSON.stringify({ email: DEMO_ADMIN.email }))).toBeNull()
    expect(parseAdminCredentials(JSON.stringify({ email: "", password: "x" }))).toBeNull()
  })

  it("prefers env over the seeded file", () => {
    const env = { QA_ADMIN_EMAIL: "owner@example.com", QA_ADMIN_PASSWORD: "from-env" } as unknown as NodeJS.ProcessEnv
    expect(adminCredentials(env, () => file)).toEqual({ email: "owner@example.com", password: "from-env" })
  })

  it("falls back to the seeded file, then to nothing", () => {
    expect(adminCredentials({} as NodeJS.ProcessEnv, () => file)).toEqual({ email: DEMO_ADMIN.email, password: "from-file" })
    expect(adminCredentials({} as NodeJS.ProcessEnv, () => null)).toBeNull()
  })

  it("only types the address on camera when it is the demo admin", () => {
    expect(isDemoAdminEmail(DEMO_ADMIN.email)).toBe(true)
    expect(isDemoAdminEmail("owner@example.com")).toBe(false)
    expect(canSignInOnCamera({ email: DEMO_ADMIN.email, password: "x" })).toBe(true)
    expect(canSignInOnCamera({ email: "owner@example.com", password: "x" })).toBe(false)
    expect(canSignInOnCamera(null)).toBe(false)
  })
})
