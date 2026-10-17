import { describe, expect, it } from "vitest"

import { products } from "@/features/products/lib/data/data"
import { productHeroSchema, productSchema } from "@/features/products/lib/domain/schema"

/**
 * S69 splits one `hero` field doing two opposed jobs into two fields that are
 * each honest about theirs:
 *
 *   - `cinematicHero` — the front door. Optional, flagship only, one 16 MB
 *     frame sequence on the page people land on.
 *   - `productHero` — every product has one. Static, server-rendered, no
 *     canvas and no blocking preload.
 *
 * `parallax` and `exploded` are deleted, not deprecated: four scrollytelling
 * heroes is ~48 MB and a frame sequence to produce per product. One cinematic
 * is a signature; four is a tax.
 */
describe("productHero", () => {
  it("is required on every product", () => {
    for (const product of products) {
      expect(product.productHero, `${product.slug} has no productHero`).toBeDefined()
    }
  })

  it("fails parsing when a product omits it", () => {
    const [first] = products
    const { productHero: _dropped, ...withoutHero } = first
    expect(() => productSchema.parse(withoutHero)).toThrow()
  })

  it("carries the writing the intro used to hold", () => {
    for (const product of products) {
      expect(product.productHero.kicker.length, `${product.slug} kicker`).toBeGreaterThan(0)
      expect(product.productHero.title.length, `${product.slug} title`).toBeGreaterThan(0)
      expect(product.productHero.subtitle.length, `${product.slug} subtitle`).toBeGreaterThan(0)
      expect(product.productHero.image, `${product.slug} image`).toMatch(/^\//)
    }
  })

  it("defaults the copy to the right-hand side", () => {
    const parsed = productHeroSchema.parse({
      image: "/products/momo-air.png",
      kicker: "THE EARBUDS",
      title: "Momo Air",
      subtitle: "Weightless. Wireless. Everywhere.",
    })
    expect(parsed.align).toBe("right")
  })

  it("rejects an alignment that is not a side", () => {
    expect(() =>
      productHeroSchema.parse({
        image: "/products/momo-air.png",
        kicker: "THE EARBUDS",
        title: "Momo Air",
        subtitle: "Weightless.",
        align: "center",
      }),
    ).toThrow()
  })
})

describe("cinematicHero", () => {
  it("belongs to the flagship alone", () => {
    const withCinematic = products.filter((product) => product.cinematicHero)
    expect(withCinematic.map((product) => product.slug)).toEqual(["momo-x"])
  })

  it("is still the 192-frame sequence", () => {
    const flagship = products.find((product) => product.slug === "momo-x")
    expect(flagship?.cinematicHero?.kind).toBe("frames")
    expect(flagship?.cinematicHero?.frameCount).toBe(192)
  })

  it("parses without one, because only the front door has one", () => {
    const air = products.find((product) => product.slug === "momo-air")
    expect(air?.cinematicHero).toBeUndefined()
    expect(() => productSchema.parse(air)).not.toThrow()
  })
})

describe("the deleted hero kinds", () => {
  /**
   * The old `hero` field was a discriminated union over `frames | parallax |
   * exploded`. `productHero` is not a union at all, so a record carrying a
   * `kind` is no longer a hero of any sort — these assert the shapes that used
   * to parse no longer do.
   */
  it.each(["parallax", "exploded"])("no longer accepts a %s hero", (kind) => {
    expect(() =>
      productHeroSchema.parse({
        kind,
        image: "/products/momo-air.png",
        accent: "oklch(0.78 0.14 190)",
        motion: "rise",
        scrollVh: 320,
        intro: { kicker: "Introducing", title: "Momo Air", subtitle: "Weightless." },
        beats: [],
      }),
    ).toThrow()
  })

  it("leaves no product carrying a hero kind discriminant", () => {
    for (const product of products) {
      expect(product, `${product.slug} still has a polymorphic hero`).not.toHaveProperty("hero")
    }
  })
})
