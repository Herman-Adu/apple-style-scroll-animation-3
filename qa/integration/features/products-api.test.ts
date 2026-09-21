import { afterEach, describe, expect, it, vi } from "vitest"

import { productListResponse, productEmptyResponse } from "@/qa/fixtures/strapi/product.fixture"

/**
 * Exercises the product data seam end-to-end at both settings of the switch:
 *  - local-data fallback (no STRAPI_API_URL) — the current production path
 *  - Strapi path (STRAPI_API_URL set) — fetch -> mapper -> zod -> cache tags
 *
 * `useStrapi` is computed at module load, so each path dynamically imports the
 * api against a fresh registry (reset in global setup).
 */
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

describe("products api — local-data fallback", () => {
  afterEach(() => vi.restoreAllMocks())

  it("returns validated products from local data when Strapi is not configured", async () => {
    vi.stubEnv("STRAPI_API_URL", "")
    const api = await import("@/features/products/api")

    const products = await api.fetchProducts()
    expect(products.length).toBeGreaterThan(0)
    // every item satisfies the domain contract
    for (const p of products) {
      expect(typeof p.slug).toBe("string")
      expect(p.price).toHaveProperty("amount")
    }
  })

  it("resolves a single product by slug and null for a miss", async () => {
    vi.stubEnv("STRAPI_API_URL", "")
    const api = await import("@/features/products/api")

    const slugs = await api.fetchProductSlugs()
    expect(slugs.length).toBeGreaterThan(0)

    const found = await api.fetchProduct(slugs[0])
    expect(found?.slug).toBe(slugs[0])
    expect(await api.fetchProduct("does-not-exist")).toBeNull()
  })
})

describe("products api — Strapi path", () => {
  afterEach(() => vi.restoreAllMocks())

  it("fetches, maps, and validates a Strapi collection", async () => {
    vi.stubEnv("STRAPI_API_URL", "https://cms.test/")
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(productListResponse))
    vi.stubGlobal("fetch", fetchMock)

    const api = await import("@/features/products/api")
    const products = await api.fetchProducts()

    expect(products).toHaveLength(1)
    expect(products[0]).toMatchObject({ slug: "momo-x", price: { amount: 549, currency: "USD" } })

    // hit Strapi with populate + attached the collection cache tag
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain("/api/products?populate=*")
    expect(init.next.tags).toContain("products")
  })

  it("returns null when a slug filter yields no entries", async () => {
    vi.stubEnv("STRAPI_API_URL", "https://cms.test/")
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(productEmptyResponse)))

    const api = await import("@/features/products/api")
    expect(await api.fetchProduct("ghost")).toBeNull()
  })
})
