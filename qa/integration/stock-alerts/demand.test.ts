import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeAuth, fakeDb } from "@/qa/fakes"

/**
 * The admin sees how many people are waiting for each product. Reading that
 * demand and deleting an alert are both admin-only, so each action must refuse
 * a customer or a guest before touching the table. Prisma is an in-memory
 * stand-in; the admin rules are the real ones.
 */
type AlertRow = { id: number; email: string; productSlug: string; token: string; notifiedAt: Date | null }

let rows: AlertRow[]

const stockAlert = {
  groupBy: vi.fn(async ({ where }: { where: { notifiedAt: null } }) => {
    const waiting = rows.filter((r) => (where.notifiedAt === null ? r.notifiedAt === null : true))
    const bySlug = new Map<string, number>()
    for (const row of waiting) bySlug.set(row.productSlug, (bySlug.get(row.productSlug) ?? 0) + 1)
    return [...bySlug].map(([productSlug, count]) => ({ productSlug, _count: { _all: count } }))
  }),
  deleteMany: vi.fn(async ({ where }: { where: { id: number } }) => {
    const before = rows.length
    rows = rows.filter((r) => r.id !== where.id)
    return { count: before - rows.length }
  }),
}

const db = fakeDb({ stockAlert })
const auth = fakeAuth()
db.install()
auth.install()

const actions = () => import("@/features/stock-alerts/lib/actions/demand")

const alert = (id: number, productSlug: string, notifiedAt: Date | null = null): AlertRow => ({
  id,
  email: `shopper${id}@x.com`,
  productSlug,
  token: `token-${id}`,
  notifiedAt,
})

beforeEach(() => {
  vi.clearAllMocks()
  rows = [alert(1, "momo-x"), alert(2, "momo-x"), alert(3, "momo-s"), alert(4, "momo-x", new Date())]
  auth.session = { email: "admin@adudev.co.uk", role: "admin" }
})

describe("getWaitingDemandAction", () => {
  it("counts the people still waiting for each product", async () => {
    const { getWaitingDemandAction } = await actions()
    expect(await getWaitingDemandAction()).toEqual({ "momo-x": 2, "momo-s": 1 })
  })

  it("leaves out alerts that were already sent", async () => {
    rows = [alert(1, "momo-x", new Date()), alert(2, "momo-x", new Date())]
    const { getWaitingDemandAction } = await actions()
    expect(await getWaitingDemandAction()).toEqual({})
  })

  it("only asks the table for rows that are still waiting", async () => {
    const { getWaitingDemandAction } = await actions()
    await getWaitingDemandAction()
    expect(stockAlert.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { notifiedAt: null } }))
  })

  it("refuses a customer without reading the table", async () => {
    auth.session = { email: "shopper@x.com", role: "customer" }
    const { getWaitingDemandAction } = await actions()
    await expect(getWaitingDemandAction()).rejects.toThrow()
    expect(stockAlert.groupBy).not.toHaveBeenCalled()
  })

  it("refuses a guest without reading the table", async () => {
    auth.session = null
    const { getWaitingDemandAction } = await actions()
    await expect(getWaitingDemandAction()).rejects.toThrow()
    expect(stockAlert.groupBy).not.toHaveBeenCalled()
  })
})

describe("deleteStockAlertAction", () => {
  it("removes one alert for an admin", async () => {
    const { deleteStockAlertAction } = await actions()
    expect(await deleteStockAlertAction(1)).toBe(true)
    expect(rows.map((r) => r.id)).toEqual([2, 3, 4])
  })

  it("reports false when the alert is already gone", async () => {
    const { deleteStockAlertAction } = await actions()
    expect(await deleteStockAlertAction(999)).toBe(false)
  })

  it("refuses a customer without deleting anything", async () => {
    auth.session = { email: "shopper@x.com", role: "customer" }
    const { deleteStockAlertAction } = await actions()
    await expect(deleteStockAlertAction(1)).rejects.toThrow()
    expect(stockAlert.deleteMany).not.toHaveBeenCalled()
    expect(rows).toHaveLength(4)
  })

  it("refuses a guest without deleting anything", async () => {
    auth.session = null
    const { deleteStockAlertAction } = await actions()
    await expect(deleteStockAlertAction(1)).rejects.toThrow()
    expect(stockAlert.deleteMany).not.toHaveBeenCalled()
  })

  it("rejects an id that is not a positive whole number", async () => {
    const { deleteStockAlertAction } = await actions()
    await expect(deleteStockAlertAction(-1)).rejects.toThrow()
    await expect(deleteStockAlertAction(1.5)).rejects.toThrow()
    expect(stockAlert.deleteMany).not.toHaveBeenCalled()
  })
})
