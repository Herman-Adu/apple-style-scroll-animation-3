import "server-only"
import { getServerRole } from "@/lib/auth/server"
import type { Doc } from "../schema"
import { docs } from "../content"
import { fetchStrapiDocs } from "../lib/strapi-source"
import { canViewDoc, selectRelatedDocs, sortDocs } from "../lib/doc"

/**
 * Docs data seam. Mirrors features/products and features/articles: async
 * functions returning domain types so the source is swappable with no page
 * changes. `loadDocs` prefers the Strapi CMS when configured and transparently
 * falls back to the seeded corpus otherwise (or on any CMS failure), so this is
 * the only place that knows where content comes from. See the Strapi Migration
 * Runbook doc for the full plan.
 */

async function loadDocs(): Promise<Doc[]> {
  const remote = await fetchStrapiDocs()
  return remote ?? docs
}

export async function fetchDocs(): Promise<Doc[]> {
  return sortDocs(await loadDocs())
}

export async function fetchDoc(slug: string): Promise<Doc | null> {
  const all = await loadDocs()
  return all.find((doc) => doc.slug === slug) ?? null
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
  const all = await loadDocs()
  const doc = all.find((d) => d.slug === slug)
  if (!doc) return null
  if (doc.access === "public") return { doc, authorized: true }

  const role = await getServerRole()
  const authorized = canViewDoc(doc, role === "admin")
  return { doc: authorized ? doc : { ...doc, body: [] }, authorized }
}

export async function fetchDocSlugs(): Promise<string[]> {
  const all = await loadDocs()
  return all.map((doc) => doc.slug)
}

export async function fetchRelatedDocs(slug: string): Promise<Doc[]> {
  const all = await loadDocs()
  const current = all.find((doc) => doc.slug === slug)
  if (!current) return []
  // Keep related within the same audience so a public guide never surfaces
  // admin-only guides (and vice versa).
  const sameAudience = all.filter((doc) => doc.audience === current.audience)
  return selectRelatedDocs(sameAudience, slug, current.category)
}
