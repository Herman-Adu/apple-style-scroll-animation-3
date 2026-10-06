import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeCache, fakeDb } from "@/qa/fakes"
import { getAllProducts } from "@/features/products"

/**
 * Stock comes back through three doors: an admin edit, an expired checkout
 * releasing its reservation, and a full refund. Each must announce a restock
 * to waiting customers only when availability crosses zero, and only after the
 * stock write has committed.
 */
const seed = getAllProducts()[0]
const row = (stock: number, reserved = 0) => ({ slug: seed.slug, deleted: false, data: { ...seed, stock, reserved } })

let overlay: ReturnType<typeof row> | null
let saved: unknown

const productOverlay = {
  findMany: vi.fn(async () => (overlay ? [overlay] : [])),
  findUnique: vi.fn(async () => overlay),
  upsert: vi.fn(async ({ update }: { update: { data: unknown } }) => {
    saved = update.data
    return overlay
  }),
}
const pendingCheckout = {
  findUnique: vi.fn(async () => ({ id: "p1", status: "reserved", reservedStock: [{ slug: seed.slug, quantity: 2 }] })),
  update: vi.fn(async () => ({})),
}
const orderRow = {
  id: "o1",
  number: "MOMO-1",
  userId: "u1",
  email: "ada@example.com",
  status: "processing",
  items: [{ slug: seed.slug, quantity: 2 }],
  subtotal: 100,
  shipping: 0,
  discount: 0,
  appliedOffers: [],
  total: 100,
  currency: "GBP",
  refundedAmount: 0,
  refunds: [],
  createdAt: new Date("2026-01-01"),
}
const order = {
  findFirst: vi.fn(async () => orderRow),
  update: vi.fn(async () => ({ ...orderRow, status: "refunded", refundedAmount: 100 })),
}
const user = { findUnique: vi.fn(async () => ({ email: "admin@example.com", role: "admin", roleOverride: null })) }
const notifyBackInStock = vi.fn(async (_items: { slug: string; name: string }[]) => {})

fakeCache().install()
fakeDb({ productOverlay, pendingCheckout, order, user }).install()
vi.doMock("@/features/stock-alerts/server", () => ({ notifyBackInStock }))
vi.doMock("@/lib/auth/adapters/instance", () => ({
  auth: { api: { getSession: async () => ({ user: { id: "u1" } }) } },
}))
vi.doMock("next/headers", () => ({ headers: async () => new Headers() }))

beforeEach(() => {
  overlay = null
  saved = null
  vi.clearAllMocks()
})

describe("admin edit", () => {
  async function saveWithStock(before: number, after: number) {
    overlay = row(before)
    const { saveProductOverlayAction } = await import("@/features/catalog/lib/actions/catalog")
    await saveProductOverlayAction({ ...seed, stock: after, reserved: 0 })
  }

  it("announces a restock when stock goes from zero to some", async () => {
    await saveWithStock(0, 5)

    expect(notifyBackInStock).toHaveBeenCalledTimes(1)
    expect(notifyBackInStock).toHaveBeenCalledWith([{ slug: seed.slug, name: seed.name }])
  })

  it("stays quiet when stock moves without crossing zero", async () => {
    await saveWithStock(3, 4)
    await saveWithStock(5, 0)

    expect(notifyBackInStock).not.toHaveBeenCalled()
  })

  it("still saves the product when the announcement fails", async () => {
    notifyBackInStock.mockRejectedValueOnce(new Error("mail down"))

    await expect(saveWithStock(0, 5)).resolves.toBeUndefined()
    expect(saved).toBeTruthy()
  })
})

describe("restoreStock", () => {
  async function restore(before: number, quantity: number) {
    overlay = row(before)
    const { restoreStock } = await import("@/features/orders/lib/data/finalize/stock")
    const { prisma } = await import("@/lib/db/prisma")
    return restoreStock(prisma as never, [{ slug: seed.slug, quantity }])
  }

  it("reports the products that crossed from sold out to available", async () => {
    expect(await restore(0, 2)).toEqual([{ slug: seed.slug, name: seed.name }])
  })

  it("reports nothing when the product was already available", async () => {
    expect(await restore(3, 1)).toEqual([])
  })
})

describe("expired checkout", () => {
  it("announces a restock once the reservation is released", async () => {
    overlay = row(0)
    const { releaseReservationById } = await import("@/features/orders/lib/data/finalize/orders/release")

    await releaseReservationById("p1")

    expect(notifyBackInStock).toHaveBeenCalledWith([{ slug: seed.slug, name: seed.name }])
  })

  it("stays quiet when the product was never sold out", async () => {
    overlay = row(5)
    const { releaseReservationById } = await import("@/features/orders/lib/data/finalize/orders/release")

    await releaseReservationById("p1")

    expect(notifyBackInStock).not.toHaveBeenCalled()
  })
})

describe("full refund", () => {
  const charge = {
    payment_intent: "pi_1",
    amount_refunded: 10000,
    refunds: { data: [{ id: "re_1", amount: 10000, created: 1_700_000_000 }] },
  }

  it("announces a restock when the refunded items bring a sold-out product back", async () => {
    overlay = row(0)
    const { reconcileRefund } = await import("@/features/orders/lib/data/finalize/orders/release")

    await reconcileRefund(charge as never)

    expect(notifyBackInStock).toHaveBeenCalledWith([{ slug: seed.slug, name: seed.name }])
  })

  it("stays quiet when the refund does not cross zero", async () => {
    overlay = row(4)
    const { reconcileRefund } = await import("@/features/orders/lib/data/finalize/orders/release")

    await reconcileRefund(charge as never)

    expect(notifyBackInStock).not.toHaveBeenCalled()
  })
})
