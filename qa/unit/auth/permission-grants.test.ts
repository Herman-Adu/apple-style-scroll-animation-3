import { describe, expect, it } from "vitest"
import { canManagePermissions, mergeLockers, validateGrant } from "@/lib/auth/domain/permissions"

/**
 * Lock rights are granted by the owner from the admin UI and stored in the
 * database. These pure rules decide who may manage them and which grants or
 * revokes are valid, so the server action, the repo and the UI agree.
 */
const OWNER = "herman@adudev.co.uk"
const admin = (email: string) => ({ email, role: "admin" as const })
const ADMINS = [OWNER, "designer@adudev.co.uk", "content@adudev.co.uk"]

describe("mergeLockers", () => {
  it("unions database and env lists, lowercased and de-duplicated", () => {
    expect(mergeLockers(["Designer@AduDev.co.uk"], ["designer@adudev.co.uk", "ops@x.com"])).toEqual([
      "designer@adudev.co.uk",
      "ops@x.com",
    ])
  })

  it("is empty when both are empty", () => {
    expect(mergeLockers([], [])).toEqual([])
  })
})

describe("canManagePermissions", () => {
  it("allows only the owner", () => {
    expect(canManagePermissions(admin(OWNER))).toBe(true)
    expect(canManagePermissions(admin("designer@adudev.co.uk"))).toBe(false)
  })

  it("refuses a customer using the owner email, and a signed-out viewer", () => {
    expect(canManagePermissions({ email: OWNER, role: "customer" })).toBe(false)
    expect(canManagePermissions(null)).toBe(false)
  })
})

describe("validateGrant", () => {
  const base = { admins: ADMINS, lockers: ["designer@adudev.co.uk"] }

  it("accepts granting an admin who isn't a locker yet", () => {
    expect(validateGrant({ ...base, action: "grant", subjectEmail: "Content@AduDev.co.uk" })).toEqual({
      ok: true,
      email: "content@adudev.co.uk",
    })
  })

  it("refuses granting someone who isn't an admin", () => {
    expect(validateGrant({ ...base, action: "grant", subjectEmail: "shopper@x.com" })).toEqual({
      ok: false,
      error: "Only admins can be given lock rights.",
    })
  })

  it("refuses a duplicate grant", () => {
    expect(validateGrant({ ...base, action: "grant", subjectEmail: "designer@adudev.co.uk" }).ok).toBe(false)
  })

  it("refuses granting or revoking the owner, who is always allowed", () => {
    expect(validateGrant({ ...base, action: "grant", subjectEmail: OWNER }).ok).toBe(false)
    expect(validateGrant({ ...base, action: "revoke", subjectEmail: OWNER })).toEqual({
      ok: false,
      error: "The owner always has lock rights and can't be revoked.",
    })
  })

  it("accepts revoking a current locker and refuses revoking a non-locker", () => {
    expect(validateGrant({ ...base, action: "revoke", subjectEmail: "designer@adudev.co.uk" }).ok).toBe(true)
    expect(validateGrant({ ...base, action: "revoke", subjectEmail: "content@adudev.co.uk" }).ok).toBe(false)
  })

  it("refuses an empty email", () => {
    expect(validateGrant({ ...base, action: "grant", subjectEmail: "  " }).ok).toBe(false)
  })
})
