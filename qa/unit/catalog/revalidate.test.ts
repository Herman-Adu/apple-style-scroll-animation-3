import { beforeEach, describe, expect, it } from "vitest"
import { fakeCache } from "@/qa/fakes"

/**
 * Every write that changes stock busts the same set of routes. The product's own
 * page was missing from that set, so a product sold out in the admin kept
 * rendering "Add to cart" on its own page and the back-in-stock form never came.
 */
const cache = fakeCache()
const revalidatePath = cache.revalidatePath
cache.install()

describe("revalidateCatalog", () => {
  beforeEach(() => revalidatePath.mockClear())

  it("busts the product's own page, which is what decides sold out", async () => {
    const { revalidateCatalog } = await import("@/features/catalog/lib/adapters/revalidate")
    revalidateCatalog()
    expect(revalidatePath).toHaveBeenCalledWith("/products/[slug]", "page")
  })

  it("busts every other route that renders catalog data", async () => {
    const { revalidateCatalog } = await import("@/features/catalog/lib/adapters/revalidate")
    revalidateCatalog()
    for (const route of ["/", "/products", "/admin"]) expect(revalidatePath).toHaveBeenCalledWith(route)
  })
})
