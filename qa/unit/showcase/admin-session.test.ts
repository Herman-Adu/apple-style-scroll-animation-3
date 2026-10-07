import { describe, expect, it } from "vitest"
import { shouldMaskEmail } from "../../showcase/admin-session"
import { DEMO_ADMIN } from "../../../scripts/lib/showcase-admin.mjs"

describe("shouldMaskEmail", () => {
  it("masks a real admin address behind the demo alias", () => {
    expect(shouldMaskEmail("owner@example.com", DEMO_ADMIN.email)).toBe(true)
  })

  it("skips masking when the seeded demo admin signs in, since the alias equals the real address", () => {
    expect(shouldMaskEmail(DEMO_ADMIN.email, DEMO_ADMIN.email)).toBe(false)
  })

  it("skips masking whenever the alias still contains the real address, which would rewrite text forever", () => {
    expect(shouldMaskEmail("a@b.co", "xa@b.cox")).toBe(false)
  })

  it("skips masking an empty address", () => {
    expect(shouldMaskEmail("", DEMO_ADMIN.email)).toBe(false)
  })
})
