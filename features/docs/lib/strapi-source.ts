import "server-only"
import { authConfig, isStrapiConfigured } from "@/lib/auth/config"
import type { Doc, DocBlock } from "../schema"

/**
 * Strapi content source for docs. This is the CMS half of the data seam: when
 * Strapi is configured it returns mapped Docs, otherwise it returns null so the
 * api/ layer transparently falls back to the seeded corpus. Every network path
 * is wrapped so a misconfigured or unreachable backend degrades to the local
 * content rather than throwing — the preview must never go blank because the CMS
 * is down.
 *
 * The mapping below is the ONE backend-specific place: it translates Strapi's
 * dynamic-zone components into our DocBlock union. Adjust the `__component`
 * names to match your Strapi content-type; the rest of the app is untouched.
 */

/** Strapi v4 wraps fields under `attributes`; v5 flattens them. Handle both. */
function attrs(entry: any): any {
  return entry?.attributes ?? entry ?? {}
}

/** Map one Strapi dynamic-zone component to a DocBlock, or null to skip it. */
function mapBlock(component: any): DocBlock | null {
  const kind = String(component?.__component ?? "").split(".").pop()
  switch (kind) {
    case "paragraph":
      return { type: "paragraph", text: String(component.text ?? "") }
    case "heading":
      return { type: "heading", text: String(component.text ?? "") }
    case "callout":
      return {
        type: "callout",
        variant: (component.variant ?? "info") as Extract<DocBlock, { type: "callout" }>["variant"],
        title: component.title ?? undefined,
        text: String(component.text ?? ""),
      }
    case "code":
      return {
        type: "code",
        language: String(component.language ?? "text"),
        title: component.title ?? undefined,
        code: String(component.code ?? ""),
      }
    case "list":
      return {
        type: "list",
        ordered: Boolean(component.ordered),
        items: Array.isArray(component.items) ? component.items.map(String) : [],
      }
    case "steps":
      return {
        type: "steps",
        items: Array.isArray(component.items)
          ? component.items.map((i: any) => ({ title: String(i.title ?? ""), text: String(i.text ?? "") }))
          : [],
      }
    case "table":
      return {
        type: "table",
        title: component.title ?? undefined,
        headers: Array.isArray(component.headers) ? component.headers.map(String) : [],
        rows: Array.isArray(component.rows) ? component.rows.map((r: any) => (Array.isArray(r) ? r.map(String) : [])) : [],
      }
    case "quote":
      return { type: "quote", text: String(component.text ?? ""), attribution: component.attribution ?? undefined }
    case "divider":
      return { type: "divider" }
    case "mermaid":
      return {
        type: "mermaid",
        kind: component.kind ?? "flow",
        title: component.title ?? undefined,
        caption: component.caption ?? undefined,
        diagram: String(component.diagram ?? ""),
      }
    case "chart":
      return {
        type: "chart",
        chartType: component.chartType ?? "bar",
        title: component.title ?? undefined,
        caption: component.caption ?? undefined,
        unit: component.unit ?? undefined,
        xKey: String(component.xKey ?? "x"),
        data: Array.isArray(component.data) ? component.data : [],
        series: Array.isArray(component.series) ? component.series : [],
      }
    case "image": {
      // Strapi media field: url → src, alternativeText → alt, caption → caption.
      const media = attrs(component.image?.data ?? component.image)
      const url = media.url ?? component.src ?? ""
      const src = typeof url === "string" && url.startsWith("/") ? `${authConfig.apiUrl}${url}` : String(url)
      return {
        type: "image",
        src,
        alt: String(media.alternativeText ?? component.alt ?? ""),
        caption: component.caption ?? media.caption ?? undefined,
        width: media.width ?? component.width ?? undefined,
        height: media.height ?? component.height ?? undefined,
      }
    }
    default:
      return null
  }
}

/** Map a full Strapi doc entry to our domain Doc. */
function mapDoc(entry: any): Doc {
  const a = attrs(entry)
  const body: DocBlock[] = Array.isArray(a.body)
    ? a.body.map(mapBlock).filter((b: DocBlock | null): b is DocBlock => b !== null)
    : []
  return {
    slug: String(a.slug ?? ""),
    title: String(a.title ?? ""),
    category: a.category,
    audience: a.audience,
    access: a.access === "admin" ? "admin" : "public",
    summary: String(a.summary ?? ""),
    readingMinutes: Number(a.readingMinutes ?? 1),
    order: Number(a.order ?? 0),
    updatedAt: String(a.updatedAt ?? new Date().toISOString()),
    tags: Array.isArray(a.tags) ? a.tags.map(String) : [],
    body,
  }
}

function authHeaders(): Record<string, string> {
  return authConfig.strapiToken ? { Authorization: `Bearer ${authConfig.strapiToken}` } : {}
}

/**
 * Fetch all docs from Strapi. Returns null when Strapi is not configured or on
 * any failure, signalling the api/ layer to use the seeded corpus. Cached with a
 * tag so a Strapi webhook can revalidate on publish.
 */
export async function fetchStrapiDocs(): Promise<Doc[] | null> {
  if (!isStrapiConfigured()) return null
  try {
    const res = await fetch(
      // populate the dynamic zone so body components come through; adjust to
      // your content-type's field names as needed.
      `${authConfig.apiUrl}/api/docs?populate[body][populate]=*&pagination[pageSize]=200&sort=order:asc`,
      { headers: authHeaders(), next: { revalidate: 300, tags: ["docs"] } },
    )
    if (!res.ok) return null
    const json = (await res.json()) as any
    const items = Array.isArray(json?.data) ? json.data : []
    const mapped = items.map(mapDoc).filter((d: Doc) => d.slug)
    return mapped.length > 0 ? mapped : null
  } catch {
    return null
  }
}

/**
 * Fetch a single doc from Strapi by slug. This is the performance-critical read
 * path: rather than pulling the whole collection and finding one, it filters
 * server-side (`filters[slug][$eq]`) and caps the page to 1, so a single doc
 * page fetches exactly one record. Tagged with both the collection tag `docs`
 * and a granular `doc:<slug>` tag so a Strapi webhook can revalidate just the
 * one page on publish. Returns null when Strapi is unconfigured, unreachable,
 * or has no matching doc — the caller then falls back to the seeded corpus.
 */
export async function fetchStrapiDoc(slug: string): Promise<Doc | null> {
  if (!isStrapiConfigured() || !slug) return null
  try {
    const res = await fetch(
      `${authConfig.apiUrl}/api/docs?filters[slug][$eq]=${encodeURIComponent(
        slug,
      )}&populate[body][populate]=*&pagination[pageSize]=1`,
      { headers: authHeaders(), next: { revalidate: 300, tags: ["docs", `doc:${slug}`] } },
    )
    if (!res.ok) return null
    const json = (await res.json()) as any
    const items = Array.isArray(json?.data) ? json.data : []
    if (items.length === 0) return null
    const doc = mapDoc(items[0])
    return doc.slug ? doc : null
  } catch {
    return null
  }
}
