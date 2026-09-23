import type { Doc, DocAudience, DocCategory, DocSummary } from "../schema"
import { DOC_AUDIENCES, DOC_CATEGORIES, docAudienceMeta } from "../schema"

/** Pure domain selectors for docs. Fully unit-testable, no I/O. */

/** Turn heading text into a stable anchor id (kebab-case, ascii). */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

/** The in-page table-of-contents entries derived from a doc's heading blocks. */
export function getDocHeadings(doc: Doc): { id: string; text: string }[] {
  return doc.body
    .filter((block): block is Extract<Doc["body"][number], { type: "heading" }> => block.type === "heading")
    .map((block) => ({ id: slugifyHeading(block.text), text: block.text }))
}

/**
 * Filter docs by a free-text query, matched (case-insensitive) against title,
 * summary, category, and tags. Pure and order-preserving.
 */
export function filterDocs(docs: Doc[], query?: string): Doc[] {
  const q = query?.trim().toLowerCase()
  if (!q) return docs
  return docs.filter((doc) =>
    [doc.title, doc.summary, doc.category, ...doc.tags].some((field) => field.toLowerCase().includes(q)),
  )
}

/** Filter by category, or return all when category is falsy/unknown. */
export function filterDocsByCategory(docs: Doc[], category?: string | null): Doc[] {
  if (!category) return docs
  return docs.filter((doc) => doc.category === category)
}

/** Group docs by category in canonical category order, dropping empty groups. */
export function groupDocsByCategory(docs: Doc[]): { category: DocCategory; docs: Doc[] }[] {
  return DOC_CATEGORIES.map((category) => ({
    category,
    docs: docs.filter((doc) => doc.category === category).sort((a, b) => a.order - b.order),
  })).filter((group) => group.docs.length > 0)
}

/**
 * Flatten a doc's rich body blocks into a single plain-text string for
 * full-text search. Walks every text-bearing block type in the union so search
 * covers headings, paragraphs, lists, steps, callouts, tables, quotes, and
 * code. Pure; no I/O.
 */
export function flattenDocBody(doc: Doc): string {
  const parts: string[] = []
  for (const block of doc.body) {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "quote":
        parts.push(block.text)
        break
      case "callout":
        if (block.title) parts.push(block.title)
        parts.push(block.text)
        break
      case "code":
        if (block.title) parts.push(block.title)
        parts.push(block.code)
        break
      case "list":
        parts.push(block.items.join(" "))
        break
      case "steps":
        for (const step of block.items) parts.push(step.title, step.text)
        break
      case "mermaid":
      case "chart":
        if (block.title) parts.push(block.title)
        if (block.caption) parts.push(block.caption)
        break
      case "table":
        if (block.title) parts.push(block.title)
        parts.push(block.headers.join(" "))
        for (const row of block.rows) parts.push(row.join(" "))
        break
      case "divider":
        break
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim()
}

/**
 * Project a full Doc down to the card-level summary shipped to client islands.
 * When `includeBody` is true, the flattened body text is attached for full-text
 * search — callers MUST pass true only for docs the viewer may read, so admin
 * body text never reaches non-admin browsers.
 */
export function toDocSummary(doc: Doc, includeBody = false): DocSummary {
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    category: doc.category,
    audience: doc.audience,
    access: doc.access,
    readingMinutes: doc.readingMinutes,
    order: doc.order,
    tags: doc.tags,
    ...(includeBody ? { searchText: flattenDocBody(doc) } : {}),
  }
}

/** Only the docs the current viewer may see. Admins see everything. */
export function visibleDocs<T extends { access: DocSummary["access"] }>(items: T[], isAdmin: boolean): T[] {
  if (isAdmin) return items
  return items.filter((item) => item.access === "public")
}

/**
 * Whether a viewer may read a doc's body. Public docs are always viewable; admin
 * docs require an admin. The single source of truth for the access rule, used by
 * both the client nav (visibleDocs) intent and the server data layer. Pure.
 */
export function canViewDoc(doc: { access: DocSummary["access"] }, isAdmin: boolean): boolean {
  return doc.access === "public" || isAdmin
}

/** Filter by audience, or return all when audience is falsy. */
export function filterDocsByAudience<T extends { audience: DocAudience }>(
  items: T[],
  audience?: DocAudience | null,
): T[] {
  if (!audience) return items
  return items.filter((item) => item.audience === audience)
}

/** Group docs by audience in canonical audience order, dropping empty groups. */
export function groupDocsByAudience<T extends Pick<DocSummary, "audience" | "category" | "order">>(
  items: T[],
): { audience: DocAudience; meta: (typeof docAudienceMeta)[DocAudience]; docs: T[] }[] {
  return DOC_AUDIENCES.map((audience) => ({
    audience,
    meta: docAudienceMeta[audience],
    docs: items
      .filter((item) => item.audience === audience)
      .sort((a, b) => {
        const byCategory = DOC_CATEGORIES.indexOf(a.category) - DOC_CATEGORIES.indexOf(b.category)
        return byCategory !== 0 ? byCategory : a.order - b.order
      }),
  })).filter((group) => group.docs.length > 0)
}

/** Related docs: same category first, then fill from the rest, excluding self. */
export function selectRelatedDocs(docs: Doc[], slug: string, category: DocCategory, limit = 3): Doc[] {
  const others = docs.filter((doc) => doc.slug !== slug)
  const sameCategory = others.filter((doc) => doc.category === category)
  const rest = others.filter((doc) => doc.category !== category)
  return [...sameCategory, ...rest].slice(0, limit)
}

/** Sort helper: audience order, then category order, then per-category order field. */
export function sortDocs(docs: Doc[]): Doc[] {
  return [...docs].sort((a, b) => {
    const byAudience = DOC_AUDIENCES.indexOf(a.audience) - DOC_AUDIENCES.indexOf(b.audience)
    if (byAudience !== 0) return byAudience
    const byCategory = DOC_CATEGORIES.indexOf(a.category) - DOC_CATEGORIES.indexOf(b.category)
    return byCategory !== 0 ? byCategory : a.order - b.order
  })
}
