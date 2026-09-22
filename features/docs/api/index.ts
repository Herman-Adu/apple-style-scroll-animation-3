import "server-only"
import type { Doc } from "../schema"
import { docs } from "../content"
import { selectRelatedDocs, sortDocs } from "../lib/doc"

/**
 * Docs data seam. Mirrors features/products and features/articles: async
 * functions returning domain types so the migration to Strapi is a swap of
 * these bodies (fetchStrapi + mapper) with no page changes. See the Strapi
 * Migration Runbook doc for the full plan.
 */

export async function fetchDocs(): Promise<Doc[]> {
  return sortDocs(docs)
}

export async function fetchDoc(slug: string): Promise<Doc | null> {
  return docs.find((doc) => doc.slug === slug) ?? null
}

export async function fetchDocSlugs(): Promise<string[]> {
  return docs.map((doc) => doc.slug)
}

export async function fetchRelatedDocs(slug: string): Promise<Doc[]> {
  const current = docs.find((doc) => doc.slug === slug)
  if (!current) return []
  // Keep related within the same audience so a public guide never surfaces
  // admin-only guides (and vice versa).
  const sameAudience = docs.filter((doc) => doc.audience === current.audience)
  return selectRelatedDocs(sameAudience, slug, current.category)
}
