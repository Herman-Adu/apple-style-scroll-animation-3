import type { Product } from "../lib/domain/schema"
import { productPageHero } from "../lib/domain/product"
import { PageHero } from "@/components/layout/page-hero"
import { AddToCartButton } from "./add-to-cart-button"

/**
 * The product-page hero: **the same hero `/products` has**, with this
 * product's words and picture in it, plus the one thing a product page needs
 * that a collection page does not — a way to buy.
 *
 * S69 built a bespoke hero here instead, a square shot beside the copy, and
 * the owner rejected it on sight: it read as the product card sitting directly
 * beneath it with less detail, not as a hero. The collection hero reads as one
 * — full-bleed image, large two-tone headline, generous field — so S70
 * reversed the direction. One hero treatment, two places. Everything this
 * component used to draw by hand (the field behind the shot, the eyebrow, the
 * headline, the image frame) is `PageHero`'s now, and the per-product accent
 * gradient went with it, because "bespoke per product" was the defect.
 *
 * **Still a server component, and still the point of it.** S69's result was
 * three client renderers each pulling framer-motion onto a product page
 * becoming one server-rendered hero, and that result survives this rewrite:
 * `PageHero` was made a server component in the same sprint so reusing it
 * could not undo it. `qa/unit/products/product-hero-is-server.test.ts` holds
 * the line for both files, and if either ever needs `"use client"` the design
 * has gone wrong.
 *
 * `AddToCartButton` is a client component, which is fine and is the whole
 * shape of the thing: the interactive leaf is a client island inside a
 * server-rendered page, instead of the page being a client component so that
 * one button can be.
 */
export function ProductHero({ product }: { product: Product }) {
  return (
    <PageHero
      content={productPageHero(product)}
      actions={<AddToCartButton product={product} color={product.colors[0]} />}
    />
  )
}
