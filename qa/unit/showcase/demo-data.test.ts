import { describe, expect, it } from "vitest"
import {
  DEMO_EMAIL_DOMAIN,
  DEMO_ID_PREFIX,
  DEMO_ORDER_PREFIX,
  SEEDED_MODELS,
  assertSeedTarget,
  buildCleanupPlan,
  buildDemoData,
  isDemoRow,
} from "../../../scripts/lib/showcase-demo-data.mjs"

const NOW = new Date("2026-10-06T09:00:00.000Z")
const PRODUCT_SLUGS = ["momo-x", "momo-air", "momo-studio", "momo-beat"]
const DAY_MS = 24 * 60 * 60 * 1000

const money = (value: number) => Math.round(value * 100) / 100

interface DemoOrder {
  number: string
  userId: string
  email: string
  status: string
  currency: string
  items: Array<{ slug: string; unitAmount: number; quantity: number }>
  subtotal: number
  shipping: number
  discount: number
  discountCode?: string | null
  appliedOffers: Array<Record<string, unknown>>
  total: number
  refundedAmount: number
  refunds: unknown[]
  carrier?: string
  trackingNumber?: string
  shippedAt?: Date
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  createdAt: Date
}

describe("buildDemoData: safety tagging", () => {
  const data = buildDemoData(NOW)

  it("only uses the reserved .test domain for every email address", () => {
    const emails = JSON.stringify(data).match(/[\w.+-]+@[\w.-]+/g) ?? []
    expect(emails.length).toBeGreaterThan(0)
    for (const email of emails) {
      expect(email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true)
    }
    expect(DEMO_EMAIL_DOMAIN.endsWith(".test")).toBe(true)
  })

  it("tags every user with the demo id prefix so cleanup can find them", () => {
    expect(data.users.length).toBeGreaterThanOrEqual(6)
    for (const user of data.users) {
      expect(user.id.startsWith(DEMO_ID_PREFIX)).toBe(true)
      expect(user.role).toBe("customer")
    }
  })

  it("never contains anything that looks like a secret key or card number", () => {
    const text = JSON.stringify(data)
    expect(text).not.toMatch(/sk_(live|test)_/)
    expect(text).not.toMatch(/pk_(live|test)_/)
    expect(text).not.toMatch(/\b\d{13,19}\b/)
  })

  it("is deterministic for a given clock so reruns upsert the same rows", () => {
    expect(buildDemoData(NOW)).toEqual(buildDemoData(NOW))
  })
})

describe("buildDemoData: orders", () => {
  const data = buildDemoData(NOW)
  const orders = data.orders as unknown as DemoOrder[]
  const userIds = new Set(data.users.map((u: { id: string }) => u.id))
  const codes = new Map(data.discountCodes.map((c: { code: string }) => [c.code, c]))

  it("creates a believable spread of orders over the last four weeks", () => {
    expect(orders.length).toBeGreaterThanOrEqual(10)
    for (const order of orders) {
      const age = NOW.getTime() - new Date(order.createdAt).getTime()
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThanOrEqual(28 * DAY_MS)
    }
  })

  it("uses unique DEMO- order numbers belonging to seeded customers", () => {
    const numbers = orders.map((o) => o.number)
    expect(new Set(numbers).size).toBe(numbers.length)
    for (const order of orders) {
      expect(order.number.startsWith(DEMO_ORDER_PREFIX)).toBe(true)
      expect(userIds.has(order.userId)).toBe(true)
      const owner = data.users.find((u: { id: string; email: string }) => u.id === order.userId)
      expect(order.email).toBe(owner?.email)
    }
  })

  it("only sells real catalog products at their real USD prices", () => {
    const prices: Record<string, number> = {
      "momo-x": 549,
      "momo-air": 249,
      "momo-studio": 699,
      "momo-beat": 349,
    }
    for (const order of orders) {
      expect(order.currency).toBe("USD")
      for (const item of order.items) {
        expect(PRODUCT_SLUGS).toContain(item.slug)
        expect(item.unitAmount).toBe(prices[item.slug])
        expect(item.quantity).toBeGreaterThan(0)
      }
    }
  })

  it("prices every order exactly the way the checkout engine does", () => {
    for (const order of orders) {
      const subtotal = money(
        order.items.reduce(
          (sum: number, i: { unitAmount: number; quantity: number }) => sum + i.unitAmount * i.quantity,
          0,
        ),
      )
      expect(order.subtotal).toBe(subtotal)
      expect(order.total).toBe(money(Math.max(0, subtotal - order.discount) + order.shipping))
    }
  })

  it("applies each percent code with the same rules as the pricing engine", () => {
    const used = orders.filter((o) => o.discountCode)
    expect(used.length).toBeGreaterThanOrEqual(3)
    for (const order of used) {
      const code = codes.get(order.discountCode ?? "") as unknown as { kind: string; value: number | null }
      expect(code).toBeDefined()
      expect(code.kind).toBe("percent")
      expect(order.discount).toBe(money((order.subtotal * (code.value ?? 0)) / 100))
      expect(order.appliedOffers[0]).toMatchObject({ kind: "percent", amount: order.discount })
    }
  })

  it("charges no shipping, because the live checkout has no flat shipping fee yet", () => {
    for (const order of orders) {
      expect(order.shipping).toBe(0)
    }
  })

  it("never shows a free-shipping code being used, since it would waive nothing", () => {
    const shippingCodes = data.discountCodes
      .filter((c: { kind: string }) => c.kind === "shipping")
      .map((c: { code: string }) => c.code)
    for (const order of orders) {
      expect(shippingCodes).not.toContain(order.discountCode)
    }
  })

  it("keeps each code's redemption count equal to the orders that used it", () => {
    for (const code of data.discountCodes) {
      const used = orders.filter((o) => o.discountCode === code.code)
      expect(code.redemptionCount).toBe(used.length)
    }
  })

  it("covers every order status the admin filters by", () => {
    const statuses = new Set(orders.map((o) => o.status))
    for (const status of ["processing", "fulfilled", "refunded", "cancelled"]) {
      expect(statuses.has(status)).toBe(true)
    }
  })

  it("gives fulfilled orders tracking and refunded orders a refund record", () => {
    for (const order of orders) {
      if (order.status === "fulfilled") {
        expect(order.carrier).toBeTruthy()
        expect(order.trackingNumber).toBeTruthy()
        expect(order.shippedAt).toBeInstanceOf(Date)
      }
      if (order.status === "refunded") {
        expect(order.refundedAmount).toBe(order.total)
        expect(order.refunds).toHaveLength(1)
      }
    }
  })

  it("leaves Stripe ids empty so a demo order can never be refunded for real", () => {
    for (const order of orders) {
      expect(order.stripeSessionId ?? null).toBeNull()
      expect(order.stripePaymentIntentId ?? null).toBeNull()
    }
  })
})

describe("buildDemoData: discount codes and offers", () => {
  const data = buildDemoData(NOW)

  it("ships a headline percent code and a free-shipping code for the demo", () => {
    const launch = data.discountCodes.find((c: { code: string }) => c.code === "LAUNCH20")
    const ship = data.discountCodes.find((c: { code: string }) => c.code === "FREESHIP")
    expect(launch).toMatchObject({ kind: "percent", value: 20, active: true })
    expect(ship).toMatchObject({ kind: "shipping", active: true })
  })

  it("includes an expired code and a used-up code so the admin shows every state", () => {
    const expired = data.discountCodes.find((c: { expiresAt: Date | null }) => c.expiresAt && c.expiresAt < NOW)
    const usedUp = data.discountCodes.find(
      (c: { maxRedemptions: number | null; redemptionCount: number }) =>
        c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions,
    )
    expect(expired).toBeDefined()
    expect(usedUp).toBeDefined()
  })

  it("puts personal offers on customers in the OfferTag shape", () => {
    const withOffers = data.users.filter((u: { offers: unknown[] }) => u.offers.length > 0)
    expect(withOffers.length).toBeGreaterThanOrEqual(2)
    for (const user of withOffers) {
      for (const offer of user.offers) {
        expect(["percent", "shipping", "custom"]).toContain(offer.kind)
        expect(offer.label).toBeTruthy()
        expect(offer.createdAt).toBeTruthy()
      }
    }
  })
})

describe("buildDemoData: email, campaigns and messages", () => {
  const data = buildDemoData(NOW)

  it("seeds one sent, one scheduled and one draft campaign", () => {
    const statuses = data.campaigns.map((c: { status: string }) => c.status).sort()
    expect(statuses).toEqual(["draft", "scheduled", "sent"])
  })

  it("keeps the sent campaign's stats consistent with its recipients", () => {
    const sent = data.campaigns.find((c: { status: string }) => c.status === "sent") as unknown as {
      stats: Record<string, number>
      sentAt: Date | null
    }
    const { recipients, sent: ok, failed, skipped } = sent.stats
    expect(recipients).toBe(ok + failed + skipped)
    expect(sent.sentAt).toBeInstanceOf(Date)
    expect(recipients).toBeLessThanOrEqual(data.subscribers.length)
  })

  it("points every campaign at a real template key and a valid audience", () => {
    const realKeys = ["welcome", "personal_offer", "shipping_update", "order_confirmation"]
    for (const campaign of data.campaigns) {
      expect(realKeys).toContain(campaign.templateKey)
      expect(["all_subscribers", "manual"]).toContain(campaign.audience.type)
    }
  })

  it("can never email a real subscriber: manual audiences of demo addresses only", () => {
    for (const campaign of data.campaigns) {
      expect(campaign.audience.type).toBe("manual")
      expect(campaign.audience.emails.length).toBeGreaterThan(0)
      for (const email of campaign.audience.emails) {
        expect(email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true)
      }
    }
  })

  it("dates the scheduled campaign in the future so no sweep could ever pick it up", () => {
    const scheduled = data.campaigns.find((c: { status: string }) => c.status === "scheduled") as {
      scheduledAt: Date
    }
    expect(scheduled.scheduledAt.getTime()).toBeGreaterThan(NOW.getTime() + DAY_MS)
  })

  it("includes a mix of opted-in and opted-out subscribers", () => {
    expect(data.subscribers.some((s: { optedIn: boolean }) => s.optedIn)).toBe(true)
    expect(data.subscribers.some((s: { optedIn: boolean }) => !s.optedIn)).toBe(true)
  })

  it("seeds reply snippets, sent messages and email log rows for the dashboard", () => {
    expect(data.messagePresets.length).toBeGreaterThanOrEqual(4)
    expect(data.customerMessages.length).toBeGreaterThanOrEqual(2)
    expect(data.emailLogs.length).toBeGreaterThanOrEqual(10)
    const types = new Set(data.emailLogs.map((l: { type: string }) => l.type))
    expect(types.has("campaign")).toBe(true)
    expect(types.has("transactional")).toBe(true)
  })

  it("seeds published reviews that show on the product pages", () => {
    expect(data.reviews.length).toBeGreaterThanOrEqual(4)
    for (const review of data.reviews) {
      expect(review.id.startsWith(DEMO_ID_PREFIX)).toBe(true)
      expect(review.status).toBe("published")
      expect(PRODUCT_SLUGS).toContain(review.productSlug)
      expect(review.rating).toBeGreaterThanOrEqual(1)
      expect(review.rating).toBeLessThanOrEqual(5)
    }
  })
})

describe("buildDemoData: waiting stock alerts", () => {
  const alerts = buildDemoData(NOW).stockAlerts as Array<{
    email: string
    productSlug: string
    token: string
    createdAt: Date
    notifiedAt: Date | null
  }>

  it("seeds people waiting on more than one real product, still waiting", () => {
    expect(new Set(alerts.map((a) => a.productSlug)).size).toBeGreaterThanOrEqual(2)
    for (const alert of alerts) {
      expect(PRODUCT_SLUGS).toContain(alert.productSlug)
      expect(alert.notifiedAt).toBeNull()
      expect(alert.createdAt.getTime()).toBeLessThanOrEqual(NOW.getTime())
    }
  })

  it("only waits on demo addresses, one alert per email and product, with tagged unique tokens", () => {
    const pairs = alerts.map((a) => `${a.email}|${a.productSlug}`)
    expect(new Set(pairs).size).toBe(pairs.length)
    expect(new Set(alerts.map((a) => a.token)).size).toBe(alerts.length)
    for (const alert of alerts) {
      expect(alert.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`)).toBe(true)
      expect(alert.token.startsWith(DEMO_ID_PREFIX)).toBe(true)
    }
  })

  it("cleanup removes the waiting alerts by their demo email", () => {
    const step = buildCleanupPlan().find((s: { model: string }) => s.model === "stockAlert")
    expect(step?.where).toEqual({ email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } })
  })
})

describe("assertSeedTarget", () => {
  const url = "postgres://u:p@ep-live-123-pooler.us-east-1.aws.neon.tech/neondb"

  it("refuses to run when there is no database url", () => {
    expect(() => assertSeedTarget({ databaseUrl: undefined, confirmed: true })).toThrow(/DATABASE_URL/)
    expect(() => assertSeedTarget({ databaseUrl: "", confirmed: true })).toThrow(/DATABASE_URL/)
  })

  it("refuses a value that is not a postgres url", () => {
    expect(() => assertSeedTarget({ databaseUrl: "not a url", confirmed: true })).toThrow(/valid/i)
    expect(() => assertSeedTarget({ databaseUrl: "https://example.com/db", confirmed: true })).toThrow(/postgres/i)
  })

  it("refuses to touch the database without an explicit confirmation", () => {
    expect(() => assertSeedTarget({ databaseUrl: url, confirmed: false })).toThrow(/--confirm/)
  })

  it("returns only the host for logging, never the credentials", () => {
    const target = assertSeedTarget({ databaseUrl: url, confirmed: true })
    expect(target).toEqual({ host: "ep-live-123-pooler.us-east-1.aws.neon.tech" })
    expect(JSON.stringify(target)).not.toContain("u:p")
  })
})

describe("isDemoRow", () => {
  it("recognises rows by id prefix, email domain or order number", () => {
    expect(isDemoRow({ id: `${DEMO_ID_PREFIX}user-1` })).toBe(true)
    expect(isDemoRow({ email: `ava@${DEMO_EMAIL_DOMAIN}` })).toBe(true)
    expect(isDemoRow({ number: `${DEMO_ORDER_PREFIX}1001` })).toBe(true)
  })

  it("never matches a real customer", () => {
    expect(isDemoRow({ id: "cm9x1", email: "someone@gmail.com", number: "MOMO-1042" })).toBe(false)
    expect(isDemoRow({})).toBe(false)
  })
})

describe("buildCleanupPlan", () => {
  const plan = buildCleanupPlan()

  it("has a cleanup step for every model the seed writes", () => {
    expect(plan.map((step: { model: string }) => step.model).sort()).toEqual([...SEEDED_MODELS].sort())
  })

  it("only ever deletes rows carrying a demo tag", () => {
    const text = JSON.stringify(plan)
    expect(text).toContain(DEMO_EMAIL_DOMAIN)
    expect(text).toContain(DEMO_ID_PREFIX)
    for (const step of plan) {
      expect(Object.keys(step.where).length).toBeGreaterThan(0)
    }
  })

  it("deletes orders before the users that own them", () => {
    const models = plan.map((step: { model: string }) => step.model)
    expect(models.indexOf("order")).toBeLessThan(models.indexOf("user"))
  })
})
