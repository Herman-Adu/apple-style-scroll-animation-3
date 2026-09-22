/**
 * Docs content model.
 *
 * Mirrors the `features/articles` shape so it can migrate to the same Strapi
 * seam later: a Doc is a typed domain object, and the page/renderer layers only
 * ever touch these types — never a CMS payload. The block union is the rich
 * body format, deliberately close to what a Strapi "dynamic zone" would emit so
 * the future mapper is a 1:1 translation.
 */

/**
 * Audiences segment the library by *who* a guide is for, and access is enforced
 * per audience (see `docAudienceMeta`): user guides are public; content and
 * developer guides are admin-only. Pre-Strapi this gating is client-side
 * (localStorage auth, same model as the admin dashboard); once auth moves
 * server-side with Strapi the same `access` field drives real enforcement.
 */
export const DOC_AUDIENCES = ["user", "content", "developer"] as const

export type DocAudience = (typeof DOC_AUDIENCES)[number]

export type DocAccess = "public" | "admin"

export const docAudienceMeta = {
  user: {
    label: "User guides",
    title: "User guides",
    blurb: "Set up, pair, care for, and get the most out of your Momo Audio devices.",
    access: "public",
  },
  content: {
    label: "Content management",
    title: "Content management",
    blurb: "Run the store day to day — products, stock, orders, and customer email.",
    access: "admin",
  },
  developer: {
    label: "Developer & CTO",
    title: "Developer & CTO",
    blurb: "Architecture, the Strapi migration, DevOps, commerce internals, and positioning.",
    access: "admin",
  },
} satisfies Record<DocAudience, { label: string; title: string; blurb: string; access: DocAccess }>

export const DOC_CATEGORIES = [
  // User guides
  "Getting Started",
  "Product Care",
  "Troubleshooting",
  // Content management
  "Catalog",
  "Store Operations",
  // Developer & CTO
  "Next.js",
  "Migration",
  "DevOps",
  "Commerce",
  "Positioning",
] as const

export type DocCategory = (typeof DOC_CATEGORIES)[number]

/** Which audience each category belongs to — drives grouping and the sidebar. */
export const DOC_CATEGORY_AUDIENCE: Record<DocCategory, DocAudience> = {
  "Getting Started": "user",
  "Product Care": "user",
  Troubleshooting: "user",
  Catalog: "content",
  "Store Operations": "content",
  "Next.js": "developer",
  Migration: "developer",
  DevOps: "developer",
  Commerce: "developer",
  Positioning: "developer",
}

/** A single series in a chart block. `color` is a CSS color (usually a token var). */
export type DocChartSeries = {
  key: string
  label: string
  color: string
}

export type DocChartDatum = Record<string, string | number>

/**
 * The rich body block union. Server-renderable blocks (paragraph, heading,
 * code, table, etc.) render in an RSC; `mermaid` and `chart` render through
 * small client islands so the page itself stays a Server Component.
 */
export type DocBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "callout"; variant: "info" | "note" | "warning" | "success" | "tip"; title?: string; text: string }
  | { type: "code"; language: string; title?: string; code: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "mermaid"; kind: "architecture" | "sequence" | "flow" | "er" | "state" | "journey"; title?: string; caption?: string; diagram: string }
  | {
      type: "chart"
      chartType: "bar" | "line" | "area"
      title?: string
      caption?: string
      unit?: string
      xKey: string
      data: DocChartDatum[]
      series: DocChartSeries[]
    }
  | { type: "table"; title?: string; headers: string[]; rows: string[][] }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "divider" }

export type Doc = {
  slug: string
  title: string
  category: DocCategory
  /** Who the guide is for. */
  audience: DocAudience
  /** Visibility: "public" anyone, "admin" gated to admin accounts. */
  access: DocAccess
  summary: string
  /** Estimated reading time in minutes. */
  readingMinutes: number
  /** Sort order within a category (ascending). */
  order: number
  /** ISO date of last meaningful revision. */
  updatedAt: string
  tags: string[]
  body: DocBlock[]
}

/**
 * The card-level projection of a Doc — everything the listing/hub needs without
 * the (potentially large, potentially gated) `body`. Passing summaries to
 * client islands keeps the payload small and avoids shipping admin doc bodies
 * to the browser.
 */
export type DocSummary = Pick<
  Doc,
  "slug" | "title" | "summary" | "category" | "audience" | "access" | "readingMinutes" | "order" | "tags"
>
