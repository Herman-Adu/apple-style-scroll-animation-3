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
 * Audiences segment the library by *who* a guide is for. The library is public
 * at the audience level — user, content, developer, and CTO guides are all
 * readable by anyone, so the documentation can be linked and shown off publicly
 * (this is the "public docs hub" the Social & Recruitment Playbook points at,
 * and the CTO audience is written specifically to be shared with buyers and
 * hiring teams on socials). The only gated material is individual owner-tier
 * docs (positioning/sales), restricted to the platform owner via each doc's
 * `access` field (see `canViewDoc`). Owner gating is enforced server-side —
 * those bodies are never serialized to a non-owner (see features/docs/api) —
 * and mirrored client-side for nav.
 */
export const DOC_AUDIENCES = ["user", "content", "developer", "cto", "owner"] as const

export type DocAudience = (typeof DOC_AUDIENCES)[number]

/**
 * Visibility tiers. "public" is everyone; "admin" is any admin account; "owner"
 * is the platform owner alone (super-admin) — sales/positioning material that
 * even other admins must not see. Owner docs are gated server-side: their body
 * is never serialized to a non-owner (see features/docs/api).
 */
export type DocAccess = "public" | "admin" | "owner"

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
    access: "public",
  },
  developer: {
    label: "Developer",
    title: "Developer",
    blurb: "Architecture, the Strapi migration, DevOps, data, and commerce internals — the hands-on engineering reference.",
    access: "public",
  },
  cto: {
    label: "CTO",
    title: "CTO & Decision Makers",
    blurb:
      "The business case for the platform — ROI and total cost of ownership, technology strategy, and security posture. Written to be shared with buyers and hiring teams.",
    access: "public",
  },
  owner: {
    label: "Owner",
    title: "Owner",
    blurb: "Positioning, pricing, sales, and go-to-market playbooks — visible to the platform owner only.",
    access: "owner",
  },
} satisfies Record<DocAudience, { label: string; title: string; blurb: string; access: DocAccess }>

/**
 * Categories are the second level of the taxonomy, nested under an audience.
 * The explorer renders each non-empty category as its own collapsible dropdown,
 * so this list can grow freely — new categories (e.g. as Strapi, analytics, and
 * integrations content lands) simply appear as new dropdowns under the right
 * audience once a doc is assigned to them. Empty categories never render.
 */
export const DOC_CATEGORIES = [
  // User guides (public)
  "Getting Started",
  "Product Care",
  "Troubleshooting",
  "FAQ",
  "Warranty & Returns",
  // Content management (admin)
  "Catalog",
  "Store Operations",
  "Orders & Fulfillment",
  "Customers",
  "Email & Campaigns",
  "Media Library",
  "CMS & Publishing",
  // Developer (public)
  "Architecture",
  "Next.js",
  "Migration",
  "DevOps",
  "Commerce",
  "Data & Analytics",
  "Security & Auth",
  "API & Integrations",
  // CTO & decision makers (public)
  "Business Case",
  "Technology Strategy",
  "Security & Trust",
  // Owner (owner-only)
  "Positioning",
] as const

export type DocCategory = (typeof DOC_CATEGORIES)[number]

/** Which audience each category belongs to — drives grouping and the sidebar. */
export const DOC_CATEGORY_AUDIENCE: Record<DocCategory, DocAudience> = {
  // User guides
  "Getting Started": "user",
  "Product Care": "user",
  Troubleshooting: "user",
  FAQ: "user",
  "Warranty & Returns": "user",
  // Content management
  Catalog: "content",
  "Store Operations": "content",
  "Orders & Fulfillment": "content",
  Customers: "content",
  "Email & Campaigns": "content",
  "Media Library": "content",
  "CMS & Publishing": "content",
  // Developer
  Architecture: "developer",
  "Next.js": "developer",
  Migration: "developer",
  DevOps: "developer",
  Commerce: "developer",
  "Data & Analytics": "developer",
  "Security & Auth": "developer",
  "API & Integrations": "developer",
  // CTO & decision makers
  "Business Case": "cto",
  "Technology Strategy": "cto",
  "Security & Trust": "cto",
  // Owner
  Positioning: "owner",
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
  | {
      /**
       * A figure — screenshot, diagram export, or photo. `src` is a local
       * public path (e.g. /docs/email/campaign-compose.png) so it stays stable
       * across the Strapi migration; a Strapi media field maps to the same
       * shape (url → src, alternativeText → alt, caption → caption).
       */
      type: "image"
      src: string
      alt: string
      caption?: string
      /** Optional intrinsic dimensions to reserve layout space and avoid CLS. */
      width?: number
      height?: number
    }
  | {
      /**
       * A short muted demo clip recorded by `pnpm showcase:video`. `description`
       * is the text alternative for people who can't watch it, so it
       * should describe what the clip shows, step by step.
       */
      type: "video"
      src: string
      poster: string
      description: string
      caption?: string
      width?: number
      height?: number
    }
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
> & {
  /**
   * Flattened plain-text of the doc body for full-text search. Only populated
   * server-side for docs the viewer may read, so admin body text is never
   * shipped to non-admin browsers. Absent when the viewer can't read the body.
   */
  searchText?: string
}
