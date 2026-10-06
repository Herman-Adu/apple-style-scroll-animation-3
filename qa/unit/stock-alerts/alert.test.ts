import { describe, expect, it } from "vitest"
import { isEligibleForAlert, normalizeAlertRequest } from "@/features/stock-alerts/lib/domain/alert"

const soldOut = { releaseStatus: "available", stock: 0, reserved: 0 } as const

describe("normalizeAlertRequest", () => {
  it("trims and lowercases the email and trims the slug", () => {
    expect(normalizeAlertRequest({ email: "  Ada@Example.COM ", productSlug: " aurora-speaker " })).toEqual({
      ok: true,
      email: "ada@example.com",
      productSlug: "aurora-speaker",
    })
  })

  it("rejects an invalid email with a clear message", () => {
    const result = normalizeAlertRequest({ email: "not-an-email", productSlug: "aurora-speaker" })
    expect(result).toEqual({ ok: false, error: "Enter a valid email address." })
  })

  it("rejects an empty product slug", () => {
    const result = normalizeAlertRequest({ email: "ada@example.com", productSlug: "  " })
    expect(result.ok).toBe(false)
  })

  it("rejects input that is not an object", () => {
    expect(normalizeAlertRequest(null).ok).toBe(false)
    expect(normalizeAlertRequest("ada@example.com").ok).toBe(false)
  })
})

describe("isEligibleForAlert", () => {
  it("is true for an available product with no stock", () => {
    expect(isEligibleForAlert(soldOut)).toBe(true)
  })

  it("is true when every unit is reserved by in-flight checkouts", () => {
    expect(isEligibleForAlert({ releaseStatus: "available", stock: 2, reserved: 2 })).toBe(true)
  })

  it("is false while units remain", () => {
    expect(isEligibleForAlert({ releaseStatus: "available", stock: 3, reserved: 1 })).toBe(false)
  })

  it("is false for pre-order products, which sell without stock", () => {
    expect(isEligibleForAlert({ releaseStatus: "preorder", stock: 0, reserved: 0 })).toBe(false)
  })

  it("is false for coming-soon products", () => {
    expect(isEligibleForAlert({ releaseStatus: "coming-soon", stock: 0, reserved: 0 })).toBe(false)
  })
})
