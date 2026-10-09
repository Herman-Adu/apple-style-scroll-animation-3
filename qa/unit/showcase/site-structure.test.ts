import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { mainNav } from "@/components/layout/main-nav"
import { adminNav } from "@/features/admin"
import { DOC_AUDIENCES, docAudienceMeta } from "@/features/docs"
import { getArea, siteStructure, type AreaId } from "@/features/showcase/lib/domain/site-structure"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * The slide is derived, not written down, because the hand-written one drifted:
 * it omitted About and Contact (both top-level nav) while listing Checkout and
 * Account (neither). These fail the moment a nav item reaches no slide.
 */
const labelsIn = (id: AreaId) =>
  getArea(id).groups.flatMap((group) => [group.label, ...group.children.map((child) => child.label)])

describe("site structure", () => {
  it("covers every top-level storefront nav item", () => {
    const labels = labelsIn("storefront")
    expect(mainNav.map((item) => item.label).filter((label) => !labels.includes(label))).toEqual([])
  })

  it("covers every top-level admin nav item", () => {
    const labels = labelsIn("admin")
    expect(adminNav.map((item) => item.label).filter((label) => !labels.includes(label))).toEqual([])
  })

  it("covers every docs audience", () => {
    const labels = labelsIn("docs")
    const expected = DOC_AUDIENCES.map((audience) => docAudienceMeta[audience].label)
    expect(expected.filter((label) => !labels.includes(label))).toEqual([])
  })

  it("never emits an empty group", () => {
    const empty = siteStructure().flatMap((area) =>
      area.groups.filter((group) => group.label.trim() === "").map(() => area.id),
    )
    expect(empty).toEqual([])
  })

  it("names a real route file for every path it prints", () => {
    // Query and hash are navigation detail, not separate files.
    const pageExists = (route: string) => {
      const clean = route.split(/[?#]/)[0].replace(/\/$/, "")
      if (clean === "") return existsSync(join(REPO_ROOT, "app/page.tsx"))
      const rel = clean.replace(/^\//, "")
      return [`app/${rel}/page.tsx`, `app/(admin)/${rel}/page.tsx`].some((f) => existsSync(join(REPO_ROOT, f)))
    }
    const missing = siteStructure().flatMap((area) =>
      area.groups.flatMap((group) =>
        [group, ...group.children]
          .map((node) => node.path)
          .filter((path): path is string => Boolean(path))
          .filter((path) => !pageExists(path))
          .map((path) => `${area.id}: ${path}`),
      ),
    )
    expect(missing).toEqual([])
  })
})
