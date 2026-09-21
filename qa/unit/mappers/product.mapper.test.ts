import { describe, expect, it } from "vitest"

import { mapStrapiProduct } from "@/features/products/mappers"
import { productSchema } from "@/features/products/schema"
import { strapiProductEntry } from "@/qa/fixtures/strapi/product.fixture"

/**
 * Migration safety net: a realistic Strapi entry must survive
 * `mapStrapiProduct` -> `productSchema.parse` intact. If the CMS content-type
 * ever drifts, these assertions fail here instead of in production.
 */
describe("mapStrapiProduct", () => {
  it("maps a full Strapi entry into a valid domain product", () => {
    const parsed = productSchema.parse(mapStrapiProduct(strapiProductEntry))

    expect(parsed.slug).toBe("momo-x")
    expect(parsed.name).toBe("Momo X")
    // price is flattened from priceAmount/priceCurrency
    expect(parsed.price).toEqual({ amount: 549, currency: "USD" })
    // media resolves to a string path (relative in tests; absolute once STRAPI_API_URL is set)
    expect(typeof parsed.image).toBe("string")
    expect(parsed.image).toContain("momo_x_00096.jpg")
    expect(parsed.featured).toBe(true)
    expect(parsed.colors).toEqual(["Titanium", "Midnight", "Stone"])
  })

  it("preserves the polymorphic hero discriminant", () => {
    const parsed = productSchema.parse(mapStrapiProduct(strapiProductEntry))
    expect(parsed.hero?.kind).toBe("parallax")
  })

  it("coerces a falsy `featured` into a boolean", () => {
    const parsed = productSchema.parse(mapStrapiProduct({ ...strapiProductEntry, featured: undefined }))
    expect(parsed.featured).toBe(false)
  })

  it("also accepts the Strapi v4 `{ attributes }` envelope", () => {
    const v4 = { id: 9, attributes: strapiProductEntry }
    const parsed = productSchema.parse(mapStrapiProduct(v4))
    expect(parsed.slug).toBe("momo-x")
  })

  it("fails loudly when a required field is missing (contract drift)", () => {
    const broken = { ...strapiProductEntry, name: undefined }
    expect(() => productSchema.parse(mapStrapiProduct(broken))).toThrow()
  })
})
