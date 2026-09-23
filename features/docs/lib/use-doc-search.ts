"use client"

import { useMemo } from "react"
import MiniSearch from "minisearch"
import type { DocSummary } from "../schema"

export interface DocSearchResult {
  slug: string
  /** A short body snippet around the first match, with the term context. */
  snippet?: string
}

/**
 * Full-text search over doc summaries using MiniSearch. Indexes title, summary,
 * tags, category and the (gated) flattened body text, with fuzzy + prefix
 * matching and field weighting so titles rank above body hits.
 *
 * Only docs the viewer may read carry `searchText` (populated server-side), so
 * body matching never exposes admin content to non-admins.
 */
export function useDocSearch(docs: DocSummary[], query: string): {
  /** Ranked slugs for the current query, or null when the query is empty. */
  rankedSlugs: string[] | null
  /** slug -> best body snippet, for results that matched in the body. */
  snippets: Map<string, string>
} {
  const index = useMemo(() => {
    const mini = new MiniSearch<DocSummary & { tagsText: string }>({
      fields: ["title", "summary", "category", "tagsText", "searchText"],
      storeFields: ["slug"],
      idField: "slug",
      searchOptions: {
        boost: { title: 4, summary: 2, tagsText: 2, category: 1.5, searchText: 1 },
        prefix: true,
        fuzzy: 0.2,
        combineWith: "AND",
      },
    })
    mini.addAll(docs.map((doc) => ({ ...doc, tagsText: doc.tags.join(" ") })))
    return mini
  }, [docs])

  return useMemo(() => {
    const q = query.trim()
    if (!q) return { rankedSlugs: null, snippets: new Map<string, string>() }

    const results = index.search(q)
    const rankedSlugs = results.map((r) => r.id as string)

    const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
    const snippets = new Map<string, string>()

    for (const slug of rankedSlugs) {
      const text = bySlug.get(slug)?.searchText
      if (!text) continue
      const snippet = buildSnippet(text, terms)
      if (snippet) snippets.set(slug, snippet)
    }

    return { rankedSlugs, snippets }
  }, [index, query, docs])
}

/** Extract a ~140-char window around the first matching term. */
function buildSnippet(text: string, terms: string[]): string | undefined {
  const lower = text.toLowerCase()
  let at = -1
  for (const term of terms) {
    const found = lower.indexOf(term)
    if (found !== -1 && (at === -1 || found < at)) at = found
  }
  if (at === -1) return undefined

  const radius = 70
  const start = Math.max(0, at - radius)
  const end = Math.min(text.length, at + radius)
  const prefix = start > 0 ? "…" : ""
  const suffix = end < text.length ? "…" : ""
  return `${prefix}${text.slice(start, end).trim()}${suffix}`
}
