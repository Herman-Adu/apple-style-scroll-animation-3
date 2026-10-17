import { describe, expect, it } from "vitest"

import { products } from "@/features/products/lib/data/data"
import { productPageHero } from "@/features/products/lib/domain/product"

/**
 * S69 gave each product page a bespoke hero and the owner rejected it on
 * sight: a square shot beside the copy reads as the product card sitting
 * directly beneath it, with less detail, not as a hero. The `/products`
 * collection hero reads as one — full-bleed image, large two-tone headline,
 * generous field — so S70 reverses the direction. **One hero treatment, used
 * in two places**, with each product's own words and picture in it.
 *
 * This is the whole of "per product": a pure mapping from the product onto the
 * `PageHeroContent` the shared renderer already takes. Nothing else about a
 * product page's hero is bespoke, which is the point - so this mapping is the
 * only thing there is to test, and it is a unit test rather than a render.
 */
describe("productPageHero", () => {
  const momoX = products.find((product) => product.slug === "momo-x")!
  const hero = productPageHero(momoX)

  it("puts the product's kicker in the eyebrow", () => {
    expect(hero.eyebrow).toBe(momoX.productHero.kicker)
  })

  it("carries the product's own title and subtitle", () => {
    expect(hero.title).toBe(momoX.productHero.title)
    expect(hero.subtitle).toBe(momoX.productHero.subtitle)
  })

  it("shows the product's own shot, described by the product's name", () => {
    expect(hero.image).toBe(momoX.productHero.image)
    expect(hero.imageAlt).toBe(momoX.name)
  })

  it("keeps the side the product's copy was written for", () => {
    expect(hero.align).toBe(momoX.productHero.align)
    const studio = products.find((product) => product.slug === "momo-studio")!
    expect(studio.productHero.align, "the fixture that makes the line above mean something").toBe("left")
    expect(productPageHero(studio).align).toBe("left")
  })

  it("asks for the split treatment, which is the one /products uses", () => {
    expect(hero.layout).toBe("split")
  })

  it("leaves the accent to the title's own auto-accent", () => {
    // `TwoToneTitle` accents the last word of a headline unless given an
    // explicit substring. "Momo X" -> "X" needs no data, and a per-product
    // accent string would be exactly the bespoke-per-product treatment this
    // sprint removes.
    expect(hero.titleAccent).toBeUndefined()
  })

  it.each(products.map((product) => product.slug))("builds a complete hero for %s", (slug) => {
    const product = products.find((candidate) => candidate.slug === slug)!
    const content = productPageHero(product)
    for (const field of ["eyebrow", "title", "subtitle", "imageAlt"] as const) {
      expect(content[field], `${slug} ${field}`).toBeTruthy()
    }
    expect(content.image, `${slug} image`).toMatch(/^\//)
  })
})
