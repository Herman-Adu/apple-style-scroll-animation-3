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

export const parallaxHeroSchema = z.object({
  kind: z.literal("parallax"),
  image: z.string(),
  accent: z.string(),
  motion: z.enum(["orbit", "rise", "drift"]),
  scrollVh: z.number(),
  intro: heroIntroSchema,
  beats: z.array(storyBeatSchema),
})
export type ParallaxHero = z.infer<typeof parallaxHeroSchema>

export const explodedLayerSchema = z.object({
  image: z.string(),
  label: z.string(),
  assembledY: z.number(),
  explodedY: z.number(),
  height: z.number(),
  z: z.number(),
})
export type ExplodedLayer = z.infer<typeof explodedLayerSchema>

export const explodedHeroSchema = z.object({
  kind: z.literal("exploded"),
  accent: z.string(),
  scrollVh: z.number(),
  layers: z.array(explodedLayerSchema),
  intro: heroIntroSchema,
  beats: z.array(storyBeatSchema),
})
export type ExplodedHero = z.infer<typeof explodedHeroSchema>

export const productHeroSchema = z.discriminatedUnion("kind", [
  frameHeroSchema,
  parallaxHeroSchema,
  explodedHeroSchema,
])
export type ProductHero = z.infer<typeof productHeroSchema>

export const productSpecSchema = z.object({
  label: z.string(),
  value: z.string(),
  unit: z.string().optional(),
})
export type ProductSpec = z.infer<typeof productSpecSchema>

export const productFeatureSchema = z.object({
  title: z.string(),
  description: z.string(),
  stat: z.string(),
  statUnit: z.string(),
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
  hero: productHeroSchema,
  features: z.array(productFeatureSchema),
  specs: z.array(productSpecSchema),
  colors: z.array(z.string()),
})
export type Product = z.infer<typeof productSchema>
