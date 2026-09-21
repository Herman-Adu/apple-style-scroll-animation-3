/**
 * Docs content model.
 *
 * Mirrors the `features/articles` shape so it can migrate to the same Strapi
 * seam later: a Doc is a typed domain object, and the page/renderer layers only
 * ever touch these types — never a CMS payload. The block union is the rich
 * body format, deliberately close to what a Strapi "dynamic zone" would emit so
 * the future mapper is a 1:1 translation.
 */

export const DOC_CATEGORIES = [
  "Next.js",
  "Migration",
  "DevOps",
  "Commerce",
  "Positioning",
] as const

export type DocCategory = (typeof DOC_CATEGORIES)[number]

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
  | { type: "callout"; variant: "info" | "warning" | "success" | "tip"; title?: string; text: string }
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
