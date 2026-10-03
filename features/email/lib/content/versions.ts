import type { EmailBlock } from "../blocks/types"

/**
 * Pure, client-safe rules for template version history. The repo persists
 * snapshots; everything that decides *which* snapshot or *what changed* lives
 * here so it can be unit-tested without a database.
 */

/** Maximum snapshots kept per template. The original (v1) is always kept. */
export const VERSION_KEEP = 50

export type TemplateContent = {
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
}

export type VersionReason = "create" | "save" | "reset" | "restore" | "baseline"

type VersionRef = { id: number; version: number }

/** The earliest snapshot: what "Reset to original" returns a custom template to. */
export function pickOriginalVersion<T extends VersionRef>(versions: T[]): T | null {
  if (versions.length === 0) return null
  return versions.reduce((min, v) => (v.version < min.version ? v : min))
}

/** Ids to delete so at most VERSION_KEEP remain: the original plus the newest. */
export function versionIdsToPrune(versions: VersionRef[]): number[] {
  if (versions.length <= VERSION_KEEP) return []
  const sorted = [...versions].sort((a, b) => a.version - b.version)
  const [, ...rest] = sorted
  return rest.slice(0, versions.length - VERSION_KEEP).map((v) => v.id)
}

const FIELD_LABELS: [keyof Omit<TemplateContent, "blocks">, string][] = [
  ["name", "name"],
  ["category", "category"],
  ["subject", "subject line"],
  ["previewText", "preview text"],
  ["description", "description"],
]

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

/** Human-readable list of what changed between two snapshots, for the history panel. */
export function summarizeChange(before: TemplateContent, after: TemplateContent): string[] {
  const out: string[] = FIELD_LABELS.filter(([k]) => before[k] !== after[k]).map(([, label]) => label)

  const beforeById = new Map(before.blocks.map((b) => [b.id, b]))
  const afterIds = new Set(after.blocks.map((b) => b.id))
  const added = after.blocks.filter((b) => !beforeById.has(b.id)).length
  const removed = before.blocks.filter((b) => !afterIds.has(b.id)).length
  const edited = after.blocks.filter((b) => {
    const prev = beforeById.get(b.id)
    return prev && JSON.stringify(prev) !== JSON.stringify(b)
  }).length

  if (added) out.push(`${plural(added, "section")} added`)
  if (removed) out.push(`${plural(removed, "section")} removed`)
  if (edited) out.push(`${plural(edited, "section")} edited`)

  if (!added && !removed) {
    const order = (bs: EmailBlock[]) => bs.map((b) => b.id).join(",")
    if (order(before.blocks) !== order(after.blocks)) out.push("sections reordered")
  }
  return out
}
