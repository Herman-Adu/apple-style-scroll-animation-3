import { describe, expect, it } from "vitest"
import { crossedBackInStock, unsubscribePath } from "@/features/stock-alerts/lib/domain/restock"
import { backInStockEmail } from "@/features/email/lib/domain/content/templates"
import { SYSTEM_TEMPLATES } from "@/features/email/lib/domain/blocks/system-templates"
import { unknownPlaceholders } from "@/features/email/lib/domain/content/placeholders"

describe("crossedBackInStock", () => {
  it.each([
    [0, 1, true],
    [0, 12, true],
    [-2, 3, true],
    [3, 4, false],
    [5, 0, false],
    [0, 0, false],
    [1, 1, false],
    [-1, 0, false],
  ])("from %i to %i -> %s", (before, after, expected) => {
    expect(crossedBackInStock(before, after)).toBe(expected)
  })
})

describe("unsubscribePath", () => {
  it("carries the token as a query parameter", () => {
    expect(unsubscribePath("abc123")).toBe("/stock-alerts/unsubscribe?token=abc123")
  })

  it("encodes characters that would break the URL", () => {
    expect(unsubscribePath("a b&c")).toBe("/stock-alerts/unsubscribe?token=a%20b%26c")
  })
})

describe("back_in_stock email", () => {
  const products = {
    "momo-x": { name: "Momo X", image: "/images/momo-x.png", price: { amount: 249, currency: "GBP" } },
  }
  const params = {
    productName: "Momo X",
    productSlug: "momo-x",
    productUrl: "https://shop.test/products/momo-x",
    unsubscribeUrl: "https://shop.test/stock-alerts/unsubscribe?token=abc",
    baseUrl: "https://shop.test",
    products,
  }

  it("is a registered system template whose tokens are all known", () => {
    const template = SYSTEM_TEMPLATES.find((t) => t.key === "back_in_stock")
    expect(template).toBeDefined()
    expect(unknownPlaceholders(template!.subject)).toEqual([])
  })

  it("names the product in the subject", () => {
    expect(backInStockEmail(params).subject).toContain("Momo X")
  })

  it("shows the product image, a link to the product and an unsubscribe link", () => {
    const { html } = backInStockEmail(params)
    expect(html).toContain("https://shop.test/images/momo-x.png")
    expect(html).toContain("https://shop.test/products/momo-x")
    expect(html).toContain("https://shop.test/stock-alerts/unsubscribe?token=abc")
  })

  it("keeps the links in the plain-text version", () => {
    const { text } = backInStockEmail(params)
    expect(text).toContain("https://shop.test/products/momo-x")
    expect(text).toContain("https://shop.test/stock-alerts/unsubscribe?token=abc")
  })
})
