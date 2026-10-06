import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeDb } from "@/qa/fakes"

/**
 * Requesting a back-in-stock alert is open to guests, so the action is the
 * trust boundary: it validates the input, refuses products that cannot be
 * restocked, dedupes on (email, product) and throttles by IP. Prisma and the
 * product lookup are replaced with in-memory stand-ins.
 */
type AlertRow = { email: string; productSlug: string; token: string; notifiedAt: Date | null }

let rows: AlertRow[]
let ip = 0

const stockAlert = {
  upsert: vi.fn(
    async ({
      where,
      create,
      update,
    }: {
      where: { email_productSlug: { email: string; productSlug: string } }
      create: AlertRow
      update: Partial<AlertRow>
    }) => {
      const key = where.email_productSlug
      const hit = rows.find((r) => r.email === key.email && r.productSlug === key.productSlug)
      if (hit) {
        Object.assign(hit, update)
        return hit
      }
      rows.push({ ...create, notifiedAt: null })
      return rows[rows.length - 1]
    },
  ),
}

const products: Record<string, { slug: string; releaseStatus: string; stock: number; reserved: number }> = {
  "sold-out": { slug: "sold-out", releaseStatus: "available", stock: 0, reserved: 0 },
  "in-stock": { slug: "in-stock", releaseStatus: "available", stock: 9, reserved: 0 },
  "pre-order": { slug: "pre-order", releaseStatus: "preorder", stock: 0, reserved: 0 },
}

fakeDb({ stockAlert }).install()
// Live stock is seed + admin overlay, so the action must read the live catalog.
vi.doMock("@/features/catalog", () => ({
  getCatalogProducts: vi.fn(async () => Object.values(products)),
}))
vi.doMock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `10.0.0.${ip}` }),
}))

async function subscribe(raw: unknown) {
  const { subscribeStockAlert } = await import("@/features/stock-alerts/lib/actions/subscribe")
  return subscribeStockAlert(raw)
}

beforeEach(() => {
  rows = []
  ip += 1
  stockAlert.upsert.mockClear()
})

describe("subscribeStockAlert", () => {
  it("stores one alert for a sold-out product", async () => {
    const result = await subscribe({ email: "Ada@Example.com", productSlug: "sold-out" })

    expect(result.ok).toBe(true)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ email: "ada@example.com", productSlug: "sold-out", notifiedAt: null })
    expect(rows[0].token.length).toBeGreaterThanOrEqual(24)
  })

  it("treats a repeat request as a no-op with the same success message", async () => {
    const first = await subscribe({ email: "ada@example.com", productSlug: "sold-out" })
    const second = await subscribe({ email: "ADA@example.com", productSlug: "sold-out" })

    expect(rows).toHaveLength(1)
    expect(second).toEqual(first)
  })

  it("re-arms an alert that was already sent, keeping its token", async () => {
    await subscribe({ email: "ada@example.com", productSlug: "sold-out" })
    const token = rows[0].token
    rows[0].notifiedAt = new Date()

    await subscribe({ email: "ada@example.com", productSlug: "sold-out" })

    expect(rows).toHaveLength(1)
    expect(rows[0].notifiedAt).toBeNull()
    expect(rows[0].token).toBe(token)
  })

  it("rejects an invalid email", async () => {
    const result = await subscribe({ email: "nope", productSlug: "sold-out" })

    expect(result).toEqual({ ok: false, error: "Enter a valid email address." })
    expect(rows).toHaveLength(0)
  })

  it("rejects an unknown product", async () => {
    const result = await subscribe({ email: "ada@example.com", productSlug: "ghost" })

    expect(result.ok).toBe(false)
    expect(rows).toHaveLength(0)
  })

  it("rejects a pre-order product", async () => {
    const result = await subscribe({ email: "ada@example.com", productSlug: "pre-order" })

    expect(result.ok).toBe(false)
    expect(rows).toHaveLength(0)
  })

  it("rejects a product that is still in stock", async () => {
    const result = await subscribe({ email: "ada@example.com", productSlug: "in-stock" })

    expect(result.ok).toBe(false)
    expect(rows).toHaveLength(0)
  })

  it("refuses too many requests from one IP within a minute", async () => {
    const results = []
    for (let i = 0; i < 7; i += 1) {
      results.push(await subscribe({ email: `user${i}@example.com`, productSlug: "sold-out" }))
    }

    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true)
    expect(results[5]).toMatchObject({ ok: false })
    expect(results[6]).toMatchObject({ ok: false })
    expect(rows).toHaveLength(5)
  })
})
