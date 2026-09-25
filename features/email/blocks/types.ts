/**
 * Block model for the email builder. An email template is an ordered list of
 * blocks. Blocks are plain serializable objects stored as JSON in Postgres
 * (Strapi-friendly) and rendered to inline-styled HTML by `render.ts`.
 *
 * This module is pure and framework-free (NO "server-only") so the same code
 * renders both server-side at send time and client-side in the live admin
 * preview.
 */

export type BlockAlign = "left" | "center" | "right"

export interface HeroBlock {
  id: string
  type: "hero"
  eyebrow: string
  heading: string
  /** Words wrapped in *asterisks* render in the accent color. */
  subheading: string
  imageUrl: string
  align: BlockAlign
}

export interface HeadingBlock {
  id: string
  type: "heading"
  text: string
  align: BlockAlign
}

export interface TextBlock {
  id: string
  type: "text"
  text: string
  align: BlockAlign
}

export interface ButtonBlock {
  id: string
  type: "button"
  label: string
  href: string
  align: BlockAlign
}

export interface ImageBlock {
  id: string
  type: "image"
  src: string
  alt: string
  href: string
}

export interface DividerBlock {
  id: string
  type: "divider"
}

export interface SpacerBlock {
  id: string
  type: "spacer"
  size: "sm" | "md" | "lg"
}

export interface ListBlock {
  id: string
  type: "list"
  title: string
  /** One step per line. */
  items: string[]
  ordered: boolean
}

export interface CalloutBlock {
  id: string
  type: "callout"
  title: string
  body: string
}

/** Dynamic: expands to the current order's line items + totals at send time. */
export interface OrderSummaryBlock {
  id: string
  type: "orderSummary"
}

export type EmailBlock =
  | HeroBlock
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | ListBlock
  | CalloutBlock
  | OrderSummaryBlock

export type BlockType = EmailBlock["type"]

/** Branding shared by every render. Mirrors the EmailSettings row. */
export interface EmailBranding {
  brandName: string
  fromName: string
  supportEmail: string
  heroImageUrl: string
  accentColor: string
  footerText: string
  footerCities: string
  address: string
}

export const DEFAULT_BRANDING: EmailBranding = {
  brandName: "MOMO",
  fromName: "MOMO Audio",
  supportEmail: "",
  heroImageUrl: "",
  accentColor: "#2dd4bf",
  footerText: "Reference-grade audio, engineered in one lab.",
  footerCities: "London · Copenhagen · Accra · Tokyo",
  address: "",
}
