import "server-only";
import { authConfig, isStrapiConfigured } from "@/lib/auth/domain/config";
import {
  DOC_AUDIENCES,
  DOC_CATEGORIES,
  type Doc,
  type DocAudience,
  type DocBlock,
  type DocCategory,
} from "../domain/schema";

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
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function attrs(entry: unknown): Record<string, unknown> {
  const record = asRecord(entry);
  const attributes = record.attributes;
  return typeof attributes === "object" && attributes !== null
    ? (attributes as Record<string, unknown>)
    : record;
}

function asDocCategory(value: unknown): DocCategory {
  const candidate = String(value ?? "");
  return (DOC_CATEGORIES as readonly string[]).includes(candidate)
    ? (candidate as DocCategory)
    : "Getting Started";
}

function asDocAudience(value: unknown): DocAudience {
  const candidate = String(value ?? "");
  return (DOC_AUDIENCES as readonly string[]).includes(candidate)
    ? (candidate as DocAudience)
    : "user";
}

const MERMAID_KINDS = [
  "architecture",
  "sequence",
  "flow",
  "er",
  "state",
  "journey",
] as const;

const CHART_TYPES = ["bar", "line", "area"] as const;

function asMermaidKind(
  value: unknown,
): Extract<DocBlock, { type: "mermaid" }>["kind"] {
  const candidate = String(value ?? "");
  return (MERMAID_KINDS as readonly string[]).includes(candidate)
    ? (candidate as Extract<DocBlock, { type: "mermaid" }>["kind"])
    : "flow";
}

function asChartType(
  value: unknown,
): Extract<DocBlock, { type: "chart" }>["chartType"] {
  const candidate = String(value ?? "");
  return (CHART_TYPES as readonly string[]).includes(candidate)
    ? (candidate as Extract<DocBlock, { type: "chart" }>["chartType"])
    : "bar";
}

/** Map one Strapi dynamic-zone component to a DocBlock, or null to skip it. */
function mapBlock(component: unknown): DocBlock | null {
  const record = asRecord(component);
  const kind = String(record.__component ?? "")
    .split(".")
    .pop();
  switch (kind) {
    case "paragraph":
      return { type: "paragraph", text: String(record.text ?? "") };
    case "heading":
      return { type: "heading", text: String(record.text ?? "") };
    case "callout":
      return {
        type: "callout",
        variant: (record.variant ?? "info") as Extract<
          DocBlock,
          { type: "callout" }
        >["variant"],
        title: typeof record.title === "string" ? record.title : undefined,
        text: String(record.text ?? ""),
      };
    case "code":
      return {
        type: "code",
        language: String(record.language ?? "text"),
        title: typeof record.title === "string" ? record.title : undefined,
        code: String(record.code ?? ""),
      };
    case "list":
      return {
        type: "list",
        ordered: Boolean(record.ordered),
        items: Array.isArray(record.items) ? record.items.map(String) : [],
      };
    case "steps":
      return {
        type: "steps",
        items: Array.isArray(record.items)
          ? record.items.map((i) => {
              const item = asRecord(i);
              return {
                title: String(item.title ?? ""),
                text: String(item.text ?? ""),
              };
            })
          : [],
      };
    case "table":
      return {
        type: "table",
        title: typeof record.title === "string" ? record.title : undefined,
        headers: Array.isArray(record.headers)
          ? record.headers.map(String)
          : [],
        rows: Array.isArray(record.rows)
          ? record.rows.map((r) => (Array.isArray(r) ? r.map(String) : []))
          : [],
      };
    case "quote":
      return {
        type: "quote",
        text: String(record.text ?? ""),
        attribution:
          typeof record.attribution === "string"
            ? record.attribution
            : undefined,
      };
    case "divider":
      return { type: "divider" };
    case "mermaid":
      return {
        type: "mermaid",
        kind: asMermaidKind(record.kind),
        title: typeof record.title === "string" ? record.title : undefined,
        caption:
          typeof record.caption === "string" ? record.caption : undefined,
        diagram: String(record.diagram ?? ""),
      };
    case "chart":
      return {
        type: "chart",
        chartType: asChartType(record.chartType),
        title: typeof record.title === "string" ? record.title : undefined,
        caption:
          typeof record.caption === "string" ? record.caption : undefined,
        unit: typeof record.unit === "string" ? record.unit : undefined,
        xKey: String(record.xKey ?? "x"),
        data: Array.isArray(record.data) ? record.data : [],
        series: Array.isArray(record.series) ? record.series : [],
      };
    case "image": {
      // Strapi media field: url → src, alternativeText → alt, caption → caption.
      const image = asRecord(record.image);
      const media = attrs(image.data ?? image);
      const url = media.url ?? record.src ?? "";
      const src =
        typeof url === "string" && url.startsWith("/")
          ? `${authConfig.apiUrl}${url}`
          : String(url);
      return {
        type: "image",
        src,
        alt: String(media.alternativeText ?? record.alt ?? ""),
        caption:
          typeof record.caption === "string"
            ? record.caption
            : String(media.caption ?? ""),
        width:
          typeof media.width === "number"
            ? media.width
            : typeof record.width === "number"
              ? record.width
              : undefined,
        height:
          typeof media.height === "number"
            ? media.height
            : typeof record.height === "number"
              ? record.height
              : undefined,
      };
    }
    default:
      return null;
  }
}

/** Map a full Strapi doc entry to our domain Doc. */
function mapDoc(entry: unknown): Doc {
  const a = attrs(entry);
  const body: DocBlock[] = Array.isArray(a.body)
    ? a.body
        .map(mapBlock)
        .filter((b: DocBlock | null): b is DocBlock => b !== null)
    : [];
  return {
    slug: String(a.slug ?? ""),
    title: String(a.title ?? ""),
    category: asDocCategory(a.category),
    audience: asDocAudience(a.audience),
    access: a.access === "admin" ? "admin" : "public",
    summary: String(a.summary ?? ""),
    readingMinutes: Number(a.readingMinutes ?? 1),
    order: Number(a.order ?? 0),
    updatedAt: String(a.updatedAt ?? new Date().toISOString()),
    tags: Array.isArray(a.tags) ? a.tags.map(String) : [],
    body,
  };
}

function authHeaders(): Record<string, string> {
  return authConfig.strapiToken
    ? { Authorization: `Bearer ${authConfig.strapiToken}` }
    : {};
}

/**
 * Fetch all docs from Strapi. Returns null when Strapi is not configured or on
 * any failure, signalling the api/ layer to use the seeded corpus. Cached with a
 * tag so a Strapi webhook can revalidate on publish.
 */
export async function fetchStrapiDocs(): Promise<Doc[] | null> {
  if (!isStrapiConfigured()) return null;
  try {
    const res = await fetch(
      // populate the dynamic zone so body components come through; adjust to
      // your content-type's field names as needed.
      `${authConfig.apiUrl}/api/docs?populate[body][populate]=*&pagination[pageSize]=200&sort=order:asc`,
      { headers: authHeaders(), next: { revalidate: 300, tags: ["docs"] } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    const items = Array.isArray(json?.data) ? json.data : [];
    const mapped = items.map(mapDoc).filter((d: Doc) => d.slug);
    return mapped.length > 0 ? mapped : null;
  } catch {
    return null;
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
  if (!isStrapiConfigured() || !slug) return null;
  try {
    const res = await fetch(
      `${authConfig.apiUrl}/api/docs?filters[slug][$eq]=${encodeURIComponent(
        slug,
      )}&populate[body][populate]=*&pagination[pageSize]=1`,
      {
        headers: authHeaders(),
        next: { revalidate: 300, tags: ["docs", `doc:${slug}`] },
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    const items = Array.isArray(json?.data) ? json.data : [];
    if (items.length === 0) return null;
    const doc = mapDoc(items[0]);
    return doc.slug ? doc : null;
  } catch {
    return null;
  }
}
