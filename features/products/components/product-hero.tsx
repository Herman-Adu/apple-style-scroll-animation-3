import Image from "next/image"

import type { Product } from "../lib/domain/schema"
import { Eyebrow } from "@/components/primitives"
import { TwoToneTitle } from "@/components/primitives/two-tone-title"
import { AddToCartButton } from "./add-to-cart-button"
import { cn } from "@/lib/utils"

/**
 * The product-page hero. **A server component, and that is the point of it.**
 *
 * It replaces three client renderers - `FrameScrollHero` for the flagship,
 * `ParallaxStoryHero` for two products and `ExplodedStoryHero` for the speaker
 * - that each pulled framer-motion onto a product page to animate a hero
 * nobody had asked to scrub. The front door keeps its cinematic, where one
 * 16 MB frame sequence earns its weight on the page people land on; a product
 * page gets one staged shot, server-rendered, with no canvas and no blocking
 * preload.
 *
 * If this file ever needs `"use client"`, the design has gone wrong -
 * `qa/unit/products/product-hero-is-server.test.ts` holds that line.
 *
 * `AddToCartButton` below is a client component, which is fine and is the
 * whole shape of the thing: the interactive leaf is a client island inside a
 * server-rendered page, instead of the page being a client component so that
 * one button can be.
 */
export function ProductHero({ product }: { product: Product }) {
  const { productHero: hero } = product
  const copyFirst = hero.align === "left"

  return (
    <section className="relative overflow-hidden bg-media">
      {/* The product's own accent, as a soft field behind the shot. Static: a
          gradient, not an animated glow. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(60% 55% at ${copyFirst ? "72%" : "28%"} 45%, ${product.accent}, transparent 70%)`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:px-12 md:py-32 lg:grid-cols-2 lg:gap-20">
        <div
          className={cn(
            "relative aspect-square w-full",
            // Every one of these shots is staged on its own near-black
            // backdrop, which against the page's near-black field reads as a
            // hard-edged rectangle pasted onto it. The radial mask dissolves
            // the frame so the product sits *in* the field instead of on a
            // panel - a crop would have cut the plinth off instead.
            "[mask-image:radial-gradient(62%_62%_at_50%_47%,#000_30%,transparent_88%)]",
            copyFirst && "lg:order-last",
          )}
        >
          <Image
            src={hero.image || "/placeholder.svg"}
            alt={product.name}
            fill
            // The hero image is the page's largest contentful paint, so it is
            // the one image here that is worth prioritising.
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain"
          />
        </div>

        <div className={cn("max-w-xl", copyFirst && "lg:order-first")}>
          <Eyebrow dot={false} className="mb-5 text-on-media-muted">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: product.accent }}
              aria-hidden
            />
            {hero.kicker}
          </Eyebrow>

          <h1 className="text-balance text-4xl font-bold tracking-tight text-on-media md:text-6xl">
            <TwoToneTitle title={hero.title} tier="h1" />
          </h1>

          <p className="mt-6 text-pretty text-base leading-relaxed text-on-media-muted md:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-10">
            <AddToCartButton product={product} color={product.colors[0]} />
          </div>
        </div>
      </div>
    </section>
  )
}
