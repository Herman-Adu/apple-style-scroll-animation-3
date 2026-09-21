import { mainNav } from "@/lib/data/site"

/** Split a section href into its path, query, and hash parts. */
export function splitSectionHref(href: string) {
  const [pathAndQuery, hash = ""] = href.split("#")
  const [path, query = ""] = pathAndQuery.split("?")
  return { path, query, hash }
}

/** All scroll-spy anchor ids referenced anywhere in the nav (stable, module-level). */
export const NAV_SECTION_IDS: string[] = Array.from(
  new Set(
    mainNav
      .flatMap((link) => link.sections ?? [])
      .map((section) => splitSectionHref(section.href).hash)
      .filter(Boolean),
  ),
)

/** Whether a top-level nav link is the active route. */
export function isTopLevelActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Whether a dropdown sub-section is currently active.
 * - anchor sections match the scroll-spy `activeId`
 * - filtered routes match the `category` search param
 * - a bare route (e.g. "/products") is active when no category is set
 */
export function isSectionActive(
  href: string,
  pathname: string,
  category: string | null,
  activeId: string | null,
) {
  const { path, query, hash } = splitSectionHref(href)
  if (path !== pathname) return false
  if (hash) return activeId === hash
  if (query) return new URLSearchParams(query).get("category") === category
  return !category
}
