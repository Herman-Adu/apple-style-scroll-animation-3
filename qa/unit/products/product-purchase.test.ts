import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { getProductBySlug } from "@/features/products/lib/data/data"

vi.mock("@/features/products/components/add-to-cart-button", () => ({
  AddToCartButton: () => createElement("button", { type: "button" }, "Add to cart"),
}))

const SLOT_TEXT = "sold-out-slot"

async function render(overrides: { stock?: number; reserved?: number; releaseStatus?: "available" | "preorder" }) {
  const { ProductPurchase } = await import("@/features/products/components/product-purchase")
  const seed = getProductBySlug("momo-air")
  if (!seed) throw new Error("momo-air missing from the catalog seed")
  const product = { ...seed, stock: 0, reserved: 0, releaseStatus: "available" as const, ...overrides }
  return renderToStaticMarkup(
    createElement(ProductPurchase, { product, soldOutSlot: createElement("p", null, SLOT_TEXT) }),
  )
}

describe("ProductPurchase sold-out slot", () => {
  it("shows the slot when an available product has no stock left", async () => {
    expect(await render({ stock: 0 })).toContain(SLOT_TEXT)
  })

  it("shows the slot when everything in stock is already reserved", async () => {
    expect(await render({ stock: 3, reserved: 3 })).toContain(SLOT_TEXT)
  })

  it("hides the slot while the product is in stock", async () => {
    expect(await render({ stock: 12 })).not.toContain(SLOT_TEXT)
  })

  it("hides the slot for a pre-order, which has no physical stock to wait for", async () => {
    expect(await render({ stock: 0, releaseStatus: "preorder" })).not.toContain(SLOT_TEXT)
  })
})
