import { describe, expect, it } from "vitest"

import { priceCheckout } from "@/features/checkout/lib/domain/pricing"
import {
  buildStripeLineItems,
  toMinorUnits,
} from "@/features/checkout/lib/adapters/stripe-line-items"
import type { OrderItem } from "@/features/orders/lib/domain/types"

/**
 * Money-boundary safety net. Our catalog stores prices in major units; Stripe
 * charges in integer minor units. These assertions lock the conversion and the
 * PricedQuote -> Stripe line-item mapping so a rounding or currency-casing
 * regression fails here instead of as a wrong charge in production.
 */
describe("toMinorUnits", () => {
  it("converts whole and fractional major units to integer minor units", () => {
    expect(toMinorUnits(349)).toBe(34900)
    expect(toMinorUnits(9.99)).toBe(999)
    expect(toMinorUnits(0)).toBe(0)
  })

  it("rounds to the nearest minor unit (no floating-point drift)", () => {
    // 12.345 * 100 = 1234.4999... in IEEE-754; must round to 1235.
    expect(toMinorUnits(12.345)).toBe(1235)
    expect(toMinorUnits(0.1 + 0.2)).toBe(30)
  })
})

describe("buildStripeLineItems", () => {
  const item = (over: Partial<OrderItem> = {}): OrderItem => ({
    slug: "momo-x",
    name: "Momo X",
    color: undefined,
    quantity: 1,
    unitAmount: 349,
    currency: "GBP",
    ...over,
  })

  it("maps each priced item to an itemized Stripe line item", () => {
    const quote = priceCheckout({ items: [item({ quantity: 2 })], offers: [] })
    const lines = buildStripeLineItems(quote)

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      quantity: 2,
      price_data: {
        currency: "gbp",
        unit_amount: 34900,
        product_data: { name: "Momo X" },
      },
    })
  })

  it("lowercases the currency (Stripe requires ISO lowercase)", () => {
    const quote = priceCheckout({ items: [item()], offers: [] })
    expect(buildStripeLineItems(quote)[0].price_data?.currency).toBe("gbp")
  })

  it("appends the colour variant to the product name", () => {
    const quote = priceCheckout({ items: [item({ color: "Titanium" })], offers: [] })
    expect(buildStripeLineItems(quote)[0].price_data?.product_data?.name).toBe("Momo X — Titanium")
  })

  it("omits zero-quantity items", () => {
    const quote = priceCheckout({ items: [item({ quantity: 0 }), item({ slug: "b", quantity: 1 })], offers: [] })
    expect(buildStripeLineItems(quote)).toHaveLength(1)
  })

  it("line-item amounts reconcile with the quote subtotal", () => {
    const quote = priceCheckout({
      items: [item({ quantity: 2 }), item({ slug: "case", name: "Case", unitAmount: 39, quantity: 3 })],
      offers: [],
    })
    const lineTotalMinor = buildStripeLineItems(quote).reduce(
      (sum, line) => sum + (line.price_data?.unit_amount ?? 0) * (line.quantity ?? 0),
      0,
    )
    expect(lineTotalMinor).toBe(toMinorUnits(quote.subtotal))
  })
})
