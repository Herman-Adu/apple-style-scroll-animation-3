import { z } from "zod"

/**
 * Zod schemas are the single source of truth for the product domain. Types are
 * inferred from them, and the feature `api` layer parses raw CMS payloads
 * through these before anything reaches a component — so a Strapi field that
 * drifts from the contract fails loudly at the boundary instead of rendering
 * as `undefined` in the UI.
 */

export const moneySchema = z.object({
  amount: z.number(),
  currency: z.string(),
})
export type Money = z.infer<typeof moneySchema>

export const storyBeatSchema = z.object({
  index: z.string(),
  title: z.string(),
  description: z.string(),
  align: z.enum(["left", "right", "center"]),
  window: z.tuple([z.number(), z.number(), z.number(), z.number()]),
})
export type StoryBeat = z.infer<typeof storyBeatSchema>

const heroIntroSchema = z.object({
  kicker: z.string(),
  title: z.string(),
  subtitle: z.string(),
})

export const frameHeroSchema = z.object({
  kind: z.literal("frames"),
  framePath: z.string(),
  frameCount: z.number(),
  scrollVh: z.number(),
  intro: heroIntroSchema,
  beats: z.array(storyBeatSchema),
})
export type FrameHero = z.infer<typeof frameHeroSchema>

/**
 * S69 split one `hero` field that was doing two opposed jobs.
 *
 * The *front door* keeps its cinematic: one 16 MB frame sequence, on the page
 * people land on, where it earns its weight once. `frameHeroSchema` above is
 * that hero, and only the flagship has one.
 *
 * Every *product page* gets this instead — static, server-rendered, no canvas
 * and no blocking preload. A scrollytelling hero per product meant ~48 MB
 * across four products, each behind its own progress bar, and a frame sequence
 * to produce per product: one cinematic is a signature, four is a tax.
 *
 * `parallaxHeroSchema` and `explodedHeroSchema` were deleted here, not
 * deprecated. The writing that lived inside them is not lost — it moved into
 * `features` and `specs`, and `qa/unit/products/hero-copy-survives.test.ts`
 * holds the exact strings so it cannot quietly go missing.
 */
export const productHeroSchema = z.object({
  /** The staged product shot. */
  image: z.string(),
  /** Small, tracked, with an accent dot — "THE SPEAKER". */
  kicker: z.string(),
  /** Two-tone, rendered through `TwoToneTitle`. */
  title: z.string(),
  subtitle: z.string(),
  /** Which side the copy sits on; the image takes the other. */
  align: z.enum(["left", "right"]).default("right"),
})
/**
 * Named `...Content` because the component that renders it is `ProductHero`,
 * and a slice barrel cannot export both under one name.
 */
export type ProductHeroContent = z.infer<typeof productHeroSchema>

export const productSpecSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
})
export type ProductSpec = z.infer<typeof productSpecSchema>

/**
 * `stat` and `statUnit` are optional: S69 rehomed the story beats that used to
 * live in the `parallax` and `exploded` heroes into this array, and a beat is a
 * title and a description with no number attached. `ProductFeatures` renders
 * the stat block only when there is one, rather than making the copy invent a
 * figure it never had.
 */
export const productFeatureSchema = z.object({
  title: z.string(),
  description: z.string(),
  stat: z.string().optional(),
  statUnit: z.string().optional(),
})
export type ProductFeature = z.infer<typeof productFeatureSchema>

export const productSchema = z.object({
  slug: z.string(),
  name: z.string(),
  tagline: z.string(),
  category: z.enum(["Headphones", "Earbuds", "Speakers"]),
  price: moneySchema,
  summary: z.string(),
  description: z.string(),
  image: z.string(),
  accent: z.string(),
  featured: z.boolean(),
  releaseStatus: z.enum(["available", "preorder", "coming-soon"]),
  /**
   * The front door's cinematic. Optional, because only the flagship has one -
   * see `productHeroSchema` for why this is not per product.
   */
  cinematicHero: frameHeroSchema.optional(),
  /** Every product has one. Static and server-rendered. */
  productHero: productHeroSchema,
  features: z.array(productFeatureSchema),
  specs: z.array(productSpecSchema),
  colors: z.array(z.string()),
  /**
   * Inventory. Defaulted so payloads that predate these fields (or a Strapi
   * content-type still being extended) parse cleanly instead of failing at the
   * boundary.
   */
  stock: z.number().int().nonnegative().default(0),
  /** At or below this many available units, the product reads as low-stock. */
  lowStockThreshold: z.number().int().nonnegative().default(5),
  /** Units held by in-flight orders but not yet removed from `stock`. */
  reserved: z.number().int().nonnegative().default(0),
})
export type Product = z.infer<typeof productSchema>
