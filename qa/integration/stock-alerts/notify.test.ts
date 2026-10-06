import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeDb } from "@/qa/fakes"

/**
 * Restocking must email every waiting customer exactly once. The claim on each
 * row is atomic (updateMany where notifiedAt is null), so two restock paths
 * firing together cannot double-send, and a failed send never throws into the
 * restock that triggered it.
 */
type AlertRow = { id: number; email: string; productSlug: string; token: string; notifiedAt: Date | null }

let rows: AlertRow[]

const stockAlert = {
  findMany: vi.fn(async ({ where }: { where: { productSlug: string; notifiedAt: null } }) =>
    rows.filter((r) => r.productSlug === where.productSlug && r.notifiedAt === null).map((r) => ({ ...r })),
  ),
  updateMany: vi.fn(
    async ({ where, data }: { where: { id: number; notifiedAt: null }; data: { notifiedAt: Date | null } }) => {
      const hit = rows.find((r) => r.id === where.id && r.notifiedAt === null)
      if (!hit) return { count: 0 }
      hit.notifiedAt = data.notifiedAt
      return { count: 1 }
    },
  ),
  update: vi.fn(async ({ where, data }: { where: { id: number }; data: { notifiedAt: Date | null } }) => {
    const hit = rows.find((r) => r.id === where.id)
    if (hit) hit.notifiedAt = data.notifiedAt
    return hit
  }),
  deleteMany: vi.fn(async ({ where }: { where: { token: string } }) => {
    const before = rows.length
    rows = rows.filter((r) => r.token !== where.token)
    return { count: before - rows.length }
  }),
}

const sendBackInStockEmail = vi.fn(
  async (_input: { to: string; productName: string; productSlug: string; unsubscribeUrl: string }) =>
    ({ ok: true, id: "re_1" }) as { ok: boolean; id?: string; error?: string },
)

fakeDb({ stockAlert }).install()
vi.doMock("@/features/email/server", () => ({ sendBackInStockEmail }))

const waiting = (id: number, email: string, slug = "momo-x", notifiedAt: Date | null = null): AlertRow => ({
  id,
  email,
  productSlug: slug,
  token: `token-${id}`,
  notifiedAt,
})

async function notify(items: { slug: string; name: string }[]) {
  const { notifyBackInStock } = await import("@/features/stock-alerts/lib/data/dispatch")
  return notifyBackInStock(items)
}

beforeEach(() => {
  rows = []
  vi.clearAllMocks()
  sendBackInStockEmail.mockImplementation(async () => ({ ok: true, id: "re_1" }))
})

describe("notifyBackInStock", () => {
  it("emails every waiting customer once and marks them notified", async () => {
    rows = [waiting(1, "ada@example.com"), waiting(2, "grace@example.com")]

    await notify([{ slug: "momo-x", name: "Momo X" }])

    expect(sendBackInStockEmail).toHaveBeenCalledTimes(2)
    expect(sendBackInStockEmail.mock.calls.map(([input]) => input.to).sort()).toEqual([
      "ada@example.com",
      "grace@example.com",
    ])
    expect(rows.every((r) => r.notifiedAt !== null)).toBe(true)
  })

  it("puts each customer's own unsubscribe token in their email", async () => {
    rows = [waiting(1, "ada@example.com")]

    await notify([{ slug: "momo-x", name: "Momo X" }])

    expect(sendBackInStockEmail.mock.calls[0][0].unsubscribeUrl).toContain("/stock-alerts/unsubscribe?token=token-1")
  })

  it("ignores customers already notified and customers waiting on other products", async () => {
    rows = [waiting(1, "done@example.com", "momo-x", new Date()), waiting(2, "other@example.com", "momo-y")]

    await notify([{ slug: "momo-x", name: "Momo X" }])

    expect(sendBackInStockEmail).not.toHaveBeenCalled()
  })

  it("sends once when two restock paths fire together", async () => {
    rows = [waiting(1, "ada@example.com")]

    await Promise.all([notify([{ slug: "momo-x", name: "Momo X" }]), notify([{ slug: "momo-x", name: "Momo X" }])])

    expect(sendBackInStockEmail).toHaveBeenCalledTimes(1)
  })

  it("swallows a failed send and releases the claim so the next restock can retry", async () => {
    rows = [waiting(1, "ada@example.com")]
    sendBackInStockEmail.mockImplementationOnce(async () => ({ ok: false, error: "provider down" }))

    await expect(notify([{ slug: "momo-x", name: "Momo X" }])).resolves.toBeUndefined()

    expect(rows[0].notifiedAt).toBeNull()
  })

  it("swallows a send that throws", async () => {
    rows = [waiting(1, "ada@example.com"), waiting(2, "grace@example.com")]
    sendBackInStockEmail.mockImplementationOnce(async () => {
      throw new Error("network")
    })

    await expect(notify([{ slug: "momo-x", name: "Momo X" }])).resolves.toBeUndefined()

    expect(sendBackInStockEmail).toHaveBeenCalledTimes(2)
  })

  it("never throws when the database fails", async () => {
    stockAlert.findMany.mockRejectedValueOnce(new Error("db down"))

    await expect(notify([{ slug: "momo-x", name: "Momo X" }])).resolves.toBeUndefined()
  })
})

describe("unsubscribeStockAlert", () => {
  async function unsubscribe(token: unknown) {
    const { unsubscribeStockAlert } = await import("@/features/stock-alerts/lib/actions/unsubscribe")
    return unsubscribeStockAlert(token)
  }

  it("removes the alert that owns the token", async () => {
    rows = [waiting(1, "ada@example.com"), waiting(2, "grace@example.com")]

    const result = await unsubscribe("token-1")

    expect(result.ok).toBe(true)
    expect(rows.map((r) => r.email)).toEqual(["grace@example.com"])
  })

  it("changes nothing for an unknown token", async () => {
    rows = [waiting(1, "ada@example.com")]

    const result = await unsubscribe("not-a-token")

    expect(result.ok).toBe(false)
    expect(rows).toHaveLength(1)
  })

  it("rejects an empty or non-string token without touching the database", async () => {
    rows = [waiting(1, "ada@example.com")]

    expect((await unsubscribe("")).ok).toBe(false)
    expect((await unsubscribe(undefined)).ok).toBe(false)
    expect(stockAlert.deleteMany).not.toHaveBeenCalled()
  })
})
