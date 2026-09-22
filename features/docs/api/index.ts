import "server-only"
import { getServerRole } from "@/lib/auth/server"
import type { Doc } from "../schema"
import { docs } from "../content"
import { canViewDoc, selectRelatedDocs, sortDocs } from "../lib/doc"

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

/**
 * Fetch a doc for the current server-side viewer, enforcing access before the
 * body is ever serialized. For an admin-only doc the viewer must be an admin;
 * otherwise the body is stripped so protected content never reaches a non-admin
 * browser (title/summary metadata remain so the page can render a locked notice).
 *
 * Public docs skip the cookie read entirely, keeping those pages statically
 * renderable — only admin guides opt into per-viewer dynamic rendering.
 */
export async function fetchDocForViewer(slug: string): Promise<{ doc: Doc; authorized: boolean } | null> {
  const doc = docs.find((d) => d.slug === slug)
  if (!doc) return null
  if (doc.access === "public") return { doc, authorized: true }

  const role = await getServerRole()
  const authorized = canViewDoc(doc, role === "admin")
  return { doc: authorized ? doc : { ...doc, body: [] }, authorized }
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
