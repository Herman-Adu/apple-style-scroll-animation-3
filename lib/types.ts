/**
 * Cross-cutting types with no domain owner (money, navigation, page hero).
 * Domain types (Product, Article, CartLine) live in their feature slice;
 * lib/ never imports a slice.
 */
import type { LucideIcon } from "lucide-react"

/** Structurally identical to the products slice's `moneySchema`. */
export interface Money {
  amount: number
  currency: string
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
