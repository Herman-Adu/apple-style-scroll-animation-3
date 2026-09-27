import { BarChart3, BookOpen, LayoutDashboard, Mail, Package, Palette, Receipt, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface AdminNavChild {
  href: string
  label: string
  /**
   * Optional query segment this child represents (e.g. "subscribers"). When set,
   * the child is active only if the URL's `segment` param matches.
   */
  segment?: string
}

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Match exactly (index route) instead of by prefix. */
  exact?: boolean
  /** Sub-items rendered as an expandable disclosure. */
  children?: AdminNavChild[]
}

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/theme",
    label: "Theme",
    icon: Palette,
    children: [
      { href: "/admin/theme", label: "Active & presets" },
      { href: "/admin/theme/brand", label: "Brand colours" },
      { href: "/admin/theme/headings", label: "Headings & style" },
      { href: "/admin/theme/templates", label: "Theme templates" },
    ],
  },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  {
    href: "/admin/customers",
    label: "Customers",
    icon: Users,
    children: [
      { href: "/admin/customers", label: "All customers" },
      { href: "/admin/customers?segment=subscribers", label: "Subscribers", segment: "subscribers" },
      { href: "/admin/customers?segment=blocked", label: "Blocked", segment: "blocked" },
    ],
  },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  {
    href: "/admin/email",
    label: "Email",
    icon: Mail,
    children: [
      { href: "/admin/email", label: "Overview" },
      { href: "/admin/email/templates", label: "Templates" },
      { href: "/admin/email/campaigns", label: "Campaigns" },
      { href: "/admin/email/messages", label: "Messages" },
      { href: "/admin/email/settings", label: "Settings" },
    ],
  },
  { href: "/admin/docs", label: "Docs", icon: BookOpen },
]

export function isActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * Whether a child link is the active one — exactly one child per group may be
 * active at a time. Three kinds of children are supported:
 *
 * - Segment children share the parent's base path and are distinguished by the
 *   URL's `segment` query param (e.g. Customers → Subscribers).
 * - The index child points at the parent's own base path and is active only on
 *   that exact path with no segment selected (e.g. Theme → Active & presets).
 * - Path children have their own distinct path and are active on that path or a
 *   nested detail route under it (e.g. Theme → Brand colours).
 *
 * Detail pages that live under the base path but match no child (e.g.
 * /admin/customers/[id]) keep the parent open while highlighting no child.
 */
export function isChildActive(
  pathname: string,
  activeSegment: string | null,
  parentHref: string,
  child: AdminNavChild,
): boolean {
  const parentBase = parentHref.split("?")[0]
  const childBase = child.href.split("?")[0]

  if (child.segment) {
    return pathname === childBase && activeSegment === child.segment
  }

  // Index child: the entry that reuses the parent's base path.
  if (childBase === parentBase) {
    return pathname === parentBase && !activeSegment
  }

  // Path child: exact match or a nested route beneath it.
  return pathname === childBase || pathname.startsWith(`${childBase}/`)
}
