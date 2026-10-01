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
  /**
   * Optional product to link this image to. When set, the image is resolved
   * live from the product catalog at render time (`RenderContext.products`)
   * and `imageUrl` is ignored — so the picture always matches the linked
   * product's current image and can never drift out of sync with it. Leave
   * unset to use `imageUrl` / the brand hero image as a plain, unlinked image.
   */
  productSlug?: string | null
  /**
   * When linked to a product, also show its current price beneath the
   * subheading. Resolved live alongside the image/name (never copied into the
   * block) so the amount can't go stale if the price changes later. Ignored
   * when `productSlug` is unset.
   */
  showPrice?: boolean
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
  /**
   * Optional product to link this image to. When set, the image and alt text
   * are resolved live from the product catalog at render time
   * (`RenderContext.products`) and `src`/`alt` are ignored — so the picture
   * always matches the linked product's current name and image and can never
   * be mismatched by hand. Leave unset for a plain, unlinked image (e.g. a
   * lifestyle or banner shot).
   */
  productSlug?: string | null
  /**
   * When linked to a product, also show its current price as a caption under
   * the image. Resolved live alongside the image/name (never copied into the
   * block) so the amount can't go stale if the price changes later. Ignored
   * when `productSlug` is unset.
   */
  showPrice?: boolean
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

/**
 * A hand-picked set of products shown as a card grid (e.g. "You might also
 * like"). Unlike `HeroBlock`/`ImageBlock`'s single `productSlug`, this block
 * takes a list so staff can feature several items at once. Each card's
 * image, name, and price are resolved live from the product catalog at
 * render time (`RenderContext.products`) — never copied into the block — so
 * the picks can never drift out of sync with the catalog. Add as many slugs
 * as needed; the grid wraps into even columns.
 */
export interface ProductPicksBlock {
  id: string
  type: "productPicks"
  title: string
  slugs: string[]
}

/** Dynamic: expands to the triggering low-stock product rows at send time. */
export interface LowStockItemsBlock {
  id: string
  type: "lowStockItems"
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
  | LowStockItemsBlock
  | ProductPicksBlock

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
