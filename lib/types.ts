/**
 * Cross-cutting types shared across features, plus a compatibility shim that
 * re-exports the domain types now owned by each feature's Zod schema.
 *
 * Domain types (Product, Article, and their sub-types) are inferred from the
 * schemas in `features/*/schema` so there is a single source of truth. This
 * file keeps the historical `@/lib/types` import path working and hosts the
 * genuinely shared, cross-feature types (cart, navigation, page hero).
 */
export type {
  Money,
  StoryBeat,
  FrameHero,
  ParallaxHero,
  ExplodedLayer,
  ExplodedHero,
  ProductHero,
  ProductSpec,
  ProductFeature,
  Product,
} from "@/features/products/schema"

export type { Author, Article, ArticleBlock } from "@/features/articles/schema"

import type { LucideIcon } from "lucide-react"
import type { Product } from "@/features/products/schema"

/** A line item in the cart: a product plus its selected options. */
export interface CartLine {
  product: Product
  color: string
  quantity: number
}

/** A sub-section link inside a nav dropdown (anchor or filtered route). */
export interface NavSection {
  label: string
  /** e.g. "/about#values" or "/products?category=Headphones" */
  href: string
  /** Optional one-line description shown in the desktop dropdown. */
  hint?: string
  /** Optional leading icon, matching the top-level nav treatment. */
  icon?: LucideIcon
}

export interface NavLink {
  label: string
  href: string
  /** Optional leading icon, matching the admin nav treatment. */
  icon?: LucideIcon
  /** Optional dropdown sub-sections for this top-level item. */
  sections?: NavSection[]
}

/** Content for a shared, data-driven page hero header. */
export interface PageHeroContent {
  /** Small mono kicker above the title. */
  eyebrow: string
  title: string
  /**
   * Optional substring of `title` rendered in the teal accent (two-tone
   * headline). Must appear verbatim in `title`; ignored if not found.
   */
  titleAccent?: string
  subtitle: string
  /** Background image path (public/). */
  image: string
  imageAlt: string
  /** Which side the copy sits on (also drives the directional overlay). */
  align?: "left" | "center" | "right"
  /**
   * Hero treatment:
   * - "immersive" (default): full-bleed image behind overlaid copy.
   * - "split": horizontal two-column — image fills one half, copy the other.
   */
  layout?: "immersive" | "split"
}
