import type { EmailBlock } from "./blocks/types"

/**
 * Pure, client-safe rules for locked blocks. A locked block (typically the
 * brand header or footer) can't be edited, moved or removed until it is
 * unlocked, and new content is inserted above any locked blocks at the end of
 * the template so the footer always stays last.
 */

export function isLocked(block: { locked?: boolean } | null | undefined): boolean {
  return block?.locked === true
}

export function setLocked(blocks: EmailBlock[], id: string, locked: boolean): EmailBlock[] {
  return blocks.map((b) => (b.id === id ? ({ ...b, locked } as EmailBlock) : b))
}

/** Field edits never change the lock flag; use `setLocked` for that. */
export function updateIfUnlocked(blocks: EmailBlock[], id: string, patch: Partial<EmailBlock>): EmailBlock[] {
  const target = blocks.find((b) => b.id === id)
  if (!target || isLocked(target)) return blocks
  const { locked: _ignored, ...fields } = patch
  return blocks.map((b) => (b.id === id ? ({ ...b, ...fields } as EmailBlock) : b))
}

export function removeIfUnlocked(blocks: EmailBlock[], id: string): EmailBlock[] {
  const target = blocks.find((b) => b.id === id)
  if (!target || isLocked(target)) return blocks
  return blocks.filter((b) => b.id !== id)
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** A move is allowed when the moved block is unlocked and every locked block keeps its position. */
export function canReorder(blocks: EmailBlock[], from: number, to: number): boolean {
  if (from === to || from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return false
  if (isLocked(blocks[from])) return false
  const moved = arrayMove(blocks, from, to)
  return blocks.every((b, i) => !isLocked(b) || moved[i].id === b.id)
}

export function reorder(blocks: EmailBlock[], from: number, to: number): EmailBlock[] {
  return canReorder(blocks, from, to) ? arrayMove(blocks, from, to) : blocks
}

/**
 * Index just above the run of locked blocks at the end of the template. When
 * every block is locked there is no "body" to insert into, so append rather
 * than landing above the brand header.
 */
export function insertionIndex(blocks: EmailBlock[]): number {
  let i = blocks.length
  while (i > 0 && isLocked(blocks[i - 1])) i--
  return i === 0 ? blocks.length : i
}

export function insertBlocks(blocks: EmailBlock[], added: EmailBlock[]): EmailBlock[] {
  const at = insertionIndex(blocks)
  return [...blocks.slice(0, at), ...added, ...blocks.slice(at)]
}
