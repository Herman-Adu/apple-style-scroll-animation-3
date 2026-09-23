import { BarChart3, BookOpen, LayoutDashboard, Mail, Package, Receipt, Users } from "lucide-react"
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
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/docs", label: "Docs", icon: BookOpen },
]

export function isActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * Whether a child link is the active one. A child with a `segment` matches only
 * when on the base path AND the URL segment matches; a child without a segment
 * (the "All" entry) matches when on the base path with no segment selected.
 */
export function isChildActive(
  pathname: string,
  activeSegment: string | null,
  parentHref: string,
  child: AdminNavChild,
): boolean {
  const basePath = parentHref.split("?")[0]
  const onBase = pathname === basePath || pathname.startsWith(`${basePath}/`)
  if (!onBase) return false
  // Detail pages (/admin/customers/[id]) keep the parent open but highlight no child.
  if (pathname !== basePath) return false
  if (child.segment) return activeSegment === child.segment
  return !activeSegment
}
