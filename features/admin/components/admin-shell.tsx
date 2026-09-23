"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, Bell, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { useCatalog } from "@/features/catalog"
import { inventorySummary } from "@/features/orders"
import { UserAvatar } from "@/components/account/user-avatar"
import { adminNav, isActive, isChildActive, type AdminNavItem } from "../lib/nav"
import { AdminAccountMenu } from "./admin-account-menu"
import { AdminOnboarding } from "./admin-onboarding"

/** Quick fade/slide used for labels that appear as the sidebar expands. */
const labelMotion = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -6 },
  transition: { duration: 0.15, ease: "easeOut" as const },
}

type NavSize = "default" | "large"

/** A single (childless) nav link. */
function NavLeaf({
  item,
  active,
  collapsed,
  onNavigate,
  size,
}: {
  item: AdminNavItem
  active: boolean
  collapsed?: boolean
  onNavigate?: () => void
  size: NavSize
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-lg font-medium transition-colors",
        size === "large" ? "px-3 py-3 text-base" : "text-sm",
        collapsed ? "justify-center px-0 py-2.5" : size === "large" ? "" : "px-3 py-2",
        active
          ? "bg-accent-teal/12 text-accent-teal"
          : "text-muted-foreground hover:bg-accent-teal/12 hover:text-accent-teal",
      )}
    >
      {active && !collapsed ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-teal"
          aria-hidden
        />
      ) : null}
      <Icon className={cn("shrink-0", size === "large" ? "size-5" : "size-4")} aria-hidden />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span {...labelMotion} className="whitespace-nowrap">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

/** An expandable nav group with children (e.g. Customers). */
function NavGroup({
  item,
  pathname,
  activeSegment,
  collapsed,
  onNavigate,
  size,
}: {
  item: AdminNavItem
  pathname: string
  activeSegment: string | null
  collapsed?: boolean
  onNavigate?: () => void
  size: NavSize
}) {
  const parentActive = isActive(pathname, item)
  const [open, setOpen] = useState(parentActive)
  const Icon = item.icon
  const children = item.children ?? []
  const groupId = `nav-group-${item.href.replace(/\W+/g, "-")}`

  // Auto-expand whenever a child route becomes active.
  useEffect(() => {
    if (parentActive) setOpen(true)
  }, [parentActive])

  // Collapsed icon-rail: parent icon links to the base route, children appear in
  // a hover flyout so the section stays reachable without expanding the rail.
  if (collapsed) {
    return (
      <div className="group/flyout relative">
        <NavLeaf item={item} active={parentActive} collapsed size={size} />
        <div className="pointer-events-none absolute left-full top-0 z-50 ml-2 hidden min-w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl group-hover/flyout:pointer-events-auto group-hover/flyout:block">
          <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {item.label}
          </p>
          {children.map((child) => {
            const childActive = isChildActive(pathname, activeSegment, item.href, child)
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "block rounded-lg px-2 py-1.5 text-sm transition-colors",
                  childActive
                    ? "bg-accent-teal/12 text-accent-teal"
                    : "text-muted-foreground hover:bg-accent-teal/12 hover:text-accent-teal",
                )}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={groupId}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg font-medium transition-colors",
          size === "large" ? "px-3 py-3 text-base" : "px-3 py-2 text-sm",
          parentActive
            ? "text-accent-teal"
            : "text-muted-foreground hover:bg-accent-teal/12 hover:text-accent-teal",
        )}
      >
        {parentActive ? (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-teal"
            aria-hidden
          />
        ) : null}
        <Icon className={cn("shrink-0", size === "large" ? "size-5" : "size-4")} aria-hidden />
        <span className="flex-1 whitespace-nowrap text-left">{item.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={groupId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="ml-[19px] mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
              {children.map((child) => {
                const childActive = isChildActive(pathname, activeSegment, item.href, child)
                return (
                  <li key={child.href}>
                    <Link
                      href={child.href}
                      onClick={onNavigate}
                      aria-current={childActive ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 transition-colors",
                        size === "large" ? "text-sm" : "text-[13px]",
                        childActive
                          ? "bg-accent-teal/12 font-medium text-accent-teal"
                          : "text-muted-foreground hover:bg-accent-teal/12 hover:text-accent-teal",
                      )}
                    >
                      {child.label}
                    </Link>
                  </li>
                )
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
  size = "default",
}: {
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
  size?: NavSize
}) {
  const searchParams = useSearchParams()
  const activeSegment = searchParams.get("segment")
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {adminNav.map((item) =>
        item.children && item.children.length > 0 ? (
          <NavGroup
            key={item.href}
            item={item}
            pathname={pathname}
            activeSegment={activeSegment}
            collapsed={collapsed}
            onNavigate={onNavigate}
            size={size}
          />
        ) : (
          <NavLeaf
            key={item.href}
            item={item}
            active={isActive(pathname, item)}
            collapsed={collapsed}
            onNavigate={onNavigate}
            size={size}
          />
        ),
      )}
    </nav>
  )
}

/** Desktop sidebar contents. */
function SidebarBody({
  pathname,
  collapsed,
  onToggleCollapse,
}: {
  pathname: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { user } = useAuth()
  const displayName = user?.profile.displayName || user?.name || "Admin"

  return (
    <div className={cn("flex h-full flex-col gap-6 py-4", collapsed ? "px-2" : "px-4")}>
      {/* Brand */}
      <div className={cn("flex h-9 items-center pt-1", collapsed ? "justify-center" : "justify-between px-2")}>
        {collapsed ? (
          <Link
            href="/admin"
            className="flex size-9 items-center justify-center rounded-lg bg-accent-teal/15 text-sm font-bold text-accent-teal ring-1 ring-accent-teal/30"
            aria-label="MOMO admin"
          >
            M
          </Link>
        ) : (
          <>
            <Link href="/admin" className="text-sm font-bold tracking-[0.35em]">
              MOMO
            </Link>
            <span className="rounded-sm border border-accent-teal/30 bg-accent-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-teal">
              Admin
            </span>
          </>
        )}
      </div>

      <NavLinks pathname={pathname} collapsed={collapsed} />

      {/* Footer */}
      <div className={cn("mt-auto flex flex-col gap-2 border-t border-border pt-4", collapsed && "items-center")}>
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center gap-2 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
            collapsed ? "size-9 justify-center" : "px-3 py-2",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4 shrink-0" aria-hidden />
              Collapse
            </>
          )}
        </button>

        {/* Account — opens a guarded menu so sign-out is never a stray tap. */}
        <AdminAccountMenu align={collapsed ? "start" : "center"} side={collapsed ? "right" : "top"}>
          {collapsed ? (
            <button
              type="button"
              title={displayName}
              aria-label="Account menu"
              className="rounded-full ring-1 ring-transparent transition hover:ring-accent-teal/40"
            >
              <UserAvatar name={displayName} src={user?.profile.avatarUrl} size={36} />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Account menu"
              className="flex w-full items-center gap-3 rounded-lg bg-foreground/5 px-3 py-2 text-left transition-colors hover:bg-foreground/10"
            >
              <UserAvatar name={displayName} src={user?.profile.avatarUrl} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">{displayName}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{user?.email}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          )}
        </AdminAccountMenu>
      </div>
    </div>
  )
}

/** Mobile slide-in drawer — mirrors the storefront MobileNav feel. */
function AdminMobileNav({
  open,
  onClose,
  pathname,
}: {
  open: boolean
  onClose: () => void
  pathname: string
}) {
  const { user } = useAuth()
  const displayName = user?.profile.displayName || user?.name || "Admin"

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="glass fixed inset-y-0 left-0 z-[70] flex w-[86%] max-w-xs flex-col border-r backdrop-blur-xl backdrop-saturate-150 lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            role="dialog"
            aria-label="Admin menu"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-5">
              <span className="flex items-center gap-2.5">
                <Link href="/admin" onClick={onClose} className="text-sm font-bold tracking-[0.35em]">
                  MOMO
                </Link>
                <span className="rounded-sm border border-accent-teal/30 bg-accent-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-teal">
                  Admin
                </span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <NavLinks pathname={pathname} onNavigate={onClose} size="large" />
            </div>

            <div className="border-t border-foreground/10 p-4">
              <AdminAccountMenu align="start" side="top">
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex w-full items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-left transition-colors hover:bg-foreground/[0.06]"
                >
                  <UserAvatar name={displayName} src={user?.profile.avatarUrl} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] uppercase tracking-[0.15em] text-foreground/40">Signed in</span>
                    <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-foreground/40" aria-hidden />
                </button>
              </AdminAccountMenu>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()
  const { products } = useCatalog()
  const inventory = inventorySummary(products)
  const alerts = inventory.lowStockCount + inventory.outOfStockCount

  // Persist the collapse preference across sessions.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem("admin:sidebar-collapsed") === "1")
  }, [])
  useEffect(() => {
    window.localStorage.setItem("admin:sidebar-collapsed", collapsed ? "1" : "0")
  }, [collapsed])

  const displayName = user?.profile.displayName || user?.name || "Admin"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar — width eases between full and icon-rail. */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <SidebarBody pathname={pathname} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      <AdminMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} pathname={pathname} />

      {/* Content — padding eases in sync with the sidebar width. */}
      <div className={cn("transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-[72px]" : "lg:pl-60")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/70 px-4 backdrop-blur-xl backdrop-saturate-150 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Welcome back, {displayName.split(" ")[0]}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-balance sm:text-xl">{title}</h1>
          </div>

          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-foreground sm:inline-flex"
          >
            <ArrowUpRight className="size-3.5" aria-hidden />
            Storefront
          </Link>

          <Link
            href="/admin/products"
            aria-label={alerts > 0 ? `${alerts} restock alerts` : "No restock alerts"}
            className="relative flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent-teal/40 hover:text-foreground"
          >
            <Bell className="size-4" aria-hidden />
            {alerts > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-teal px-1 text-[10px] font-semibold text-background">
                {alerts}
              </span>
            ) : null}
          </Link>

          {/* Header avatar → account menu */}
          <AdminAccountMenu align="end" side="bottom">
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full ring-1 ring-transparent transition hover:ring-accent-teal/40"
            >
              <UserAvatar name={displayName} src={user?.profile.avatarUrl} size={36} />
            </button>
          </AdminAccountMenu>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>

      {/* First-run company onboarding — self-gates on the stored company profile. */}
      <AdminOnboarding />

      <Toaster position="top-right" />
    </div>
  )
}
