import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { getProductBySlug } from "@/features/products/lib/data/data"
// Imported at collection time, not inside the first test: a cold import of
// this component graph is charged to whichever test triggers it, and on a
// loaded machine it alone outran the 20s test timeout while the other three
// tests - reusing the module cache - passed in milliseconds. `vi.mock` is
// hoisted above imports, so the stub below still applies.
import { ProductPurchase } from "@/features/products/components/product-purchase"

vi.mock("@/features/products/components/add-to-cart-button", () => ({
  AddToCartButton: () => createElement("button", { type: "button" }, "Add to cart"),
}))

const SLOT_TEXT = "sold-out-slot"

function render(overrides: { stock?: number; reserved?: number; releaseStatus?: "available" | "preorder" }) {
  const seed = getProductBySlug("momo-air")
  if (!seed) throw new Error("momo-air missing from the catalog seed")
  const product = { ...seed, stock: 0, reserved: 0, releaseStatus: "available" as const, ...overrides }
  return renderToStaticMarkup(
    createElement(ProductPurchase, { product, soldOutSlot: createElement("p", null, SLOT_TEXT) }),
  )
}

describe("ProductPurchase sold-out slot", () => {
  it("shows the slot when an available product has no stock left", () => {
    expect(render({ stock: 0 })).toContain(SLOT_TEXT)
  })

  it("shows the slot when everything in stock is already reserved", () => {
    expect(render({ stock: 3, reserved: 3 })).toContain(SLOT_TEXT)
  })

  it("hides the slot while the product is in stock", () => {
    expect(render({ stock: 12 })).not.toContain(SLOT_TEXT)
  })

  it("hides the slot for a pre-order, which has no physical stock to wait for", () => {
    expect(render({ stock: 0, releaseStatus: "preorder" })).not.toContain(SLOT_TEXT)
  })
})
