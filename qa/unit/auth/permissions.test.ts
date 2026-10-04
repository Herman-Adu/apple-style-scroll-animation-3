import { describe, expect, it } from "vitest"
import {
  AuthorizationError,
  adminGateDecision,
  assertAdmin,
  blockLockerEmails,
  canLockBlocks,
} from "@/lib/auth/domain/permissions"

/**
 * Lock permission is a real authorization rule: the owner can always lock
 * blocks, other admins only when they are on the server-only locker list.
 * These pure rules back every enforcement layer (proxy, server actions, UI).
 */
const OWNER = "herman@adudev.co.uk"
const LOCKERS = ["designer@adudev.co.uk"]

const admin = (email: string) => ({ email, role: "admin" as const })
const customer = (email: string) => ({ email, role: "customer" as const })

describe("blockLockerEmails", () => {
  it("parses a comma-separated list, trimming and lowercasing", () => {
    expect(blockLockerEmails(" A@x.com, b@X.com ,,")).toEqual(["a@x.com", "b@x.com"])
  })

  it("is empty when unset", () => {
    expect(blockLockerEmails(undefined)).toEqual([])
    expect(blockLockerEmails("")).toEqual([])
  })
})

describe("canLockBlocks", () => {
  it("always allows the owner (super admin)", () => {
    expect(canLockBlocks(admin(OWNER), [])).toBe(true)
    expect(canLockBlocks(admin("HERMAN@adudev.co.uk"), [])).toBe(true)
  })

  it("allows an admin on the locker list, case-insensitively", () => {
    expect(canLockBlocks(admin("Designer@AduDev.co.uk"), LOCKERS)).toBe(true)
  })

  it("refuses an admin who is not on the list", () => {
    expect(canLockBlocks(admin("content@adudev.co.uk"), LOCKERS)).toBe(false)
  })

  it("refuses anyone who is not an admin, even if listed or the owner email", () => {
    expect(canLockBlocks(customer("designer@adudev.co.uk"), LOCKERS)).toBe(false)
    expect(canLockBlocks(customer(OWNER), LOCKERS)).toBe(false)
  })

  it("refuses a signed-out viewer", () => {
    expect(canLockBlocks(null, LOCKERS)).toBe(false)
  })
})

describe("assertAdmin", () => {
  it("returns the session for an admin", () => {
    const s = admin("content@adudev.co.uk")
    expect(assertAdmin(s)).toBe(s)
  })

  it("throws for a customer or a signed-out viewer", () => {
    expect(() => assertAdmin(customer("a@x.com"))).toThrow(AuthorizationError)
    expect(() => assertAdmin(null)).toThrow(AuthorizationError)
  })
})

describe("adminGateDecision (proxy)", () => {
  it("sends a signed-out page visit to sign-in with a return path", () => {
    expect(adminGateDecision(null, { method: "GET", pathname: "/admin/email/templates/3" })).toEqual({
      action: "redirect",
      to: "/sign-in?redirect=%2Fadmin%2Femail%2Ftemplates%2F3",
    })
  })

  it("sends a signed-in non-admin page visit home", () => {
    expect(adminGateDecision(customer("a@x.com"), { method: "GET", pathname: "/admin" })).toEqual({
      action: "redirect",
      to: "/",
    })
  })

  it("rejects non-GET requests (server actions) instead of redirecting", () => {
    expect(adminGateDecision(null, { method: "POST", pathname: "/admin/email" })).toEqual({ action: "deny", status: 401 })
    expect(adminGateDecision(customer("a@x.com"), { method: "POST", pathname: "/admin/email" })).toEqual({
      action: "deny",
      status: 403,
    })
  })

  it("lets admins through", () => {
    expect(adminGateDecision(admin("content@adudev.co.uk"), { method: "POST", pathname: "/admin/email" })).toEqual({
      action: "allow",
    })
  })
})
