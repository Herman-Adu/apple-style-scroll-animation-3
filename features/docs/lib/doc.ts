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

/** Project a full Doc down to the card-level summary shipped to client islands. */
export function toDocSummary(doc: Doc): DocSummary {
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
