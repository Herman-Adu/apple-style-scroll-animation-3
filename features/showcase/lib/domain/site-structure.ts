import { mainNav } from "@/components/layout/main-nav"
import { adminNav } from "@/features/admin"
import { DOC_AUDIENCES, DOC_CATEGORY_AUDIENCE, docAudienceMeta } from "@/features/docs"

/**
 * The site's shape, read from the three navigations that actually drive it.
 *
 * Nothing here is written down twice. The slide this replaced was a hand-kept
 * list and had drifted from the app: it omitted About and Contact, which are
 * top-level nav, and listed Checkout and Account, which are not.
 *
 * The three navigations nest differently, and that is the story the slides
 * tell: the storefront opens sections under each item, the admin expands
 * disclosures (Customers branches by query segment, not by path), and the docs
 * are a taxonomy of audiences over categories.
 */
export type AreaId = "overview" | "storefront" | "admin" | "docs"

export type StructureNode = { label: string; path?: string; note?: string }
export type StructureGroup = { label: string; path?: string; children: StructureNode[] }
export type StructureArea = {
  id: AreaId
  heading: string
  /** Who this front door is for. */
  forWhom: string
  groups: StructureGroup[]
}

/** The Articles dropdown is built from the newest posts, so its children would date the slide. */
const ARTICLES_NOTE = "3 most recent, generated"

function storefrontGroups(): StructureGroup[] {
  return mainNav.map((item) => ({
    label: item.label,
    path: item.href,
    children:
      item.label === "Articles"
        ? [{ label: "Latest posts", note: ARTICLES_NOTE }]
        : (item.sections ?? []).map((section) => ({ label: section.label, path: section.href })),
  }))
}

function adminGroups(): StructureGroup[] {
  return adminNav.map((item) => ({
    label: item.label,
    path: item.href,
    // A child pointing at its own parent is the disclosure's index row, not a page of its own.
    children: (item.children ?? [])
      .filter((child) => child.href !== item.href)
      .map((child) => ({ label: child.label, path: child.href })),
  }))
}

/**
 * An audience with no categories is left in rather than filtered out: dropping
 * it would fail the coverage test with a confusing message, while keeping it
 * fails the empty-group test by name.
 */
function docsGroups(): StructureGroup[] {
  return DOC_AUDIENCES.map((audience) => ({
    label: docAudienceMeta[audience].label,
    children: Object.entries(DOC_CATEGORY_AUDIENCE)
      .filter(([, owner]) => owner === audience)
      .map(([category]) => ({ label: category })),
  }))
}

function overviewGroups(): StructureGroup[] {
  return [
    { label: "Storefront", path: "/", children: [{ label: "What customers see" }] },
    { label: "Admin", path: "/admin", children: [{ label: "What the owner runs" }] },
    { label: "Docs", path: "/docs", children: [{ label: "What teams inherit" }] },
  ]
}

export function siteStructure(): StructureArea[] {
  return [
    { id: "overview", heading: "One repo, three front doors.", forWhom: "Everyone", groups: overviewGroups() },
    { id: "storefront", heading: "What customers see.", forWhom: "Shoppers", groups: storefrontGroups() },
    { id: "admin", heading: "What the owner sees.", forWhom: "Whoever runs the store", groups: adminGroups() },
    {
      id: "docs",
      heading: "What teams inherit.",
      forWhom: "Developers, CTOs and content owners",
      groups: docsGroups(),
    },
  ]
}

export function getArea(id: AreaId): StructureArea {
  const area = siteStructure().find((candidate) => candidate.id === id)
  if (!area) throw new Error(`unknown structure area: ${id}`)
  return area
}
