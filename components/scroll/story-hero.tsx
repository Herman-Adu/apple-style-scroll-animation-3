"use client"

import type { Product } from "@/lib/types"
import { FrameScrollHero } from "@/components/scroll/frame-scroll-hero"
import { ParallaxStoryHero } from "@/components/scroll/parallax-story-hero"
import { ExplodedStoryHero } from "@/components/scroll/exploded-story-hero"

/**
 * Renders the correct scroll-driven storytelling hero for a product.
 * The flagship uses a canvas frame sequence; the speaker uses an exploded-view
 * teardown; other products each get a parallax hero with their own motion
 * personality and accent.
 */
export function StoryHero({ product }: { product: Product }) {
  if (product.hero.kind === "frames") {
    return <FrameScrollHero hero={product.hero} product={product} />
  }
  if (product.hero.kind === "exploded") {
    return <ExplodedStoryHero hero={product.hero} product={product} />
  }
  return <ParallaxStoryHero hero={product.hero} product={product} />
}
