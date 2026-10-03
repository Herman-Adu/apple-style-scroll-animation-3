import type { BlockType, EmailBlock } from "../blocks/types"

/**
 * Pure, client-safe rules for saved sections: reusable groups of blocks a
 * content manager saves once and drops into any template. Stored without ids
 * so every insert gets fresh ids and never collides with existing blocks.
 */

export const SECTION_NAME_MAX = 60
export const SECTION_MAX_BLOCKS = 20

/** Distributes over the union so each block type keeps its own fields. */
export type SectionBlock = EmailBlock extends infer B ? (B extends EmailBlock ? Omit<B, "id"> : never) : never

const KNOWN_TYPES: ReadonlySet<BlockType> = new Set<BlockType>([
  "hero",
  "heading",
  "text",
  "button",
  "image",
  "divider",
  "spacer",
  "list",
  "callout",
  "orderSummary",
  "lowStockItems",
  "productPicks",
])

/** Selected blocks in template order, with ids removed. */
export function pickSectionBlocks(blocks: EmailBlock[], selectedIds: string[]): SectionBlock[] {
  const wanted = new Set(selectedIds)
  return blocks
    .filter((b) => wanted.has(b.id))
    .map(({ id: _id, ...rest }) => structuredClone(rest) as SectionBlock)
}

/** Deep copies of a saved section's blocks, each with a fresh id. */
export function instantiateSection(blocks: SectionBlock[], makeId: () => string): EmailBlock[] {
  return blocks.map((b) => ({ ...structuredClone(b), id: makeId() }) as EmailBlock)
}

export type SectionValidation = { ok: true; name: string } | { ok: false; error: string }

export function validateSectionInput(input: { name: string; blocks: SectionBlock[] }): SectionValidation {
  const name = input.name.replace(/\s+/g, " ").trim()
  if (!name) return { ok: false, error: "Give the section a name" }
  if (name.length > SECTION_NAME_MAX) return { ok: false, error: `Keep the name under ${SECTION_NAME_MAX} characters` }
  if (input.blocks.length === 0) return { ok: false, error: "Pick at least one block" }
  if (input.blocks.length > SECTION_MAX_BLOCKS)
    return { ok: false, error: `A saved section can hold up to ${SECTION_MAX_BLOCKS} blocks` }
  if (!input.blocks.every((b) => b && typeof b === "object" && KNOWN_TYPES.has((b as { type: BlockType }).type)))
    return { ok: false, error: "This section contains an unsupported block" }
  return { ok: true, name }
}
