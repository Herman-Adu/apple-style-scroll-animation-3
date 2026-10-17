import { describe, expect, it } from "vitest"

import { mapStrapiProduct } from "@/features/products/lib/adapters/mappers"
import { productSchema } from "@/features/products/lib/domain/schema"
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

  it("normalizes the product hero's media path", () => {
    // S69 replaced the polymorphic `hero` union with one flat `productHero`,
    // so there is no `kind` discriminant left to preserve - what the mapper
    // still owes is the upload path, resolved the same way `image` is.
    const parsed = productSchema.parse(mapStrapiProduct(strapiProductEntry))
    expect(parsed.productHero.image).toContain("momo_x_hero.jpg")
    expect(parsed.productHero.align).toBe("right")
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
