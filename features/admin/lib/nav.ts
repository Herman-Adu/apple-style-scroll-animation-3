import { BarChart3, BookOpen, LayoutDashboard, Mail, Package, Receipt } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Match exactly (index route) instead of by prefix. */
  exact?: boolean
}

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/email", label: "Email", icon: Mail },
  { href: "/admin/docs", label: "Docs", icon: BookOpen },
]

export function isActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}
