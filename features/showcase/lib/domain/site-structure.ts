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
export type StructureGroup = { label: string; path?: string; note?: string; children: StructureNode[] }
export type StructureArea = {
  id: AreaId
  /** Short name, as the overview slide lists it. */
  name: string
  /** Where this front door starts. */
  path?: string
  /** Who this front door is for. */
  forWhom: string
  groups: StructureGroup[]
}

/**
 * The Articles dropdown is built from the newest posts, so listing its children
 * would date the slide. The count is deliberately not printed either: it is a
 * `slice()` in main-nav that can change without anyone touching this file.
 */
const ARTICLES_NOTE = "newest posts, generated"

/** Matched on the route, not the label, so renaming the nav item cannot change the slide. */
const ARTICLES_HREF = "/articles"

function storefrontGroups(): StructureGroup[] {
  return mainNav.map((item) => ({
    label: item.label,
    path: item.href,
    children:
      item.href === ARTICLES_HREF
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
 * fails "gives every group either children or a path" by name, because a docs
 * group carries no path to fall back on.
 */
function docsGroups(): StructureGroup[] {
  return DOC_AUDIENCES.map((audience) => {
    const meta = docAudienceMeta[audience]
    return {
      label: meta.label,
      // Read from the audience's own access tier rather than named here, so the
      // slide cannot claim a page is public after someone gates it.
      ...(meta.access === "owner" ? { note: "owner only" } : {}),
      children: Object.entries(DOC_CATEGORY_AUDIENCE)
        .filter(([, owner]) => owner === audience)
        .map(([category]) => ({ label: category })),
    }
  })
}

/** The three front doors, each described by the area that defines it. */
function frontDoors(): StructureArea[] {
  return [
    { id: "storefront", name: "Storefront", path: "/", forWhom: "Shoppers", groups: storefrontGroups() },
    { id: "admin", name: "Admin", path: "/admin", forWhom: "Whoever runs the store", groups: adminGroups() },
    {
      id: "docs",
      name: "Docs",
      path: "/docs",
      forWhom: "Developers, CTOs and content owners",
      groups: docsGroups(),
    },
  ]
}

export function siteStructure(): StructureArea[] {
  const doors = frontDoors()
  return [
    {
      id: "overview",
      name: "Overview",
      forWhom: "Everyone",
      // Built from the areas themselves. Written by hand it drifted from them,
      // saying "What the owner runs" while the admin slide said "sees".
      groups: doors.map((door) => ({
        label: door.name,
        path: door.path,
        children: [{ label: door.forWhom }],
      })),
    },
    ...doors,
  ]
}

export function getArea(id: AreaId): StructureArea {
  const area = siteStructure().find((candidate) => candidate.id === id)
  if (!area) throw new Error(`unknown structure area: ${id}`)
  return area
}
