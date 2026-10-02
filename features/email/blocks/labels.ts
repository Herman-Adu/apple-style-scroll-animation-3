import type { BlockType } from "./types"

/** Blocks offered in the editor palette, in display order. Shared by the editor and the docs freshness test. */
export const PALETTE_BLOCKS: readonly { type: BlockType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "heading", label: "Heading" },
  { type: "text", label: "Text" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "list", label: "List" },
  { type: "callout", label: "Callout" },
  { type: "orderSummary", label: "Order summary" },
  { type: "productPicks", label: "Product picks" },
  { type: "divider", label: "Divider" },
  { type: "spacer", label: "Spacer" },
]

export function blockLabel(type: BlockType): string {
  return PALETTE_BLOCKS.find((b) => b.type === type)?.label ?? type
}
