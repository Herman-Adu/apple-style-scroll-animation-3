"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowUpRight, Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { useCatalog } from "@/features/catalog"
import { inventorySummary } from "@/features/orders"
import { adminNav, isActive } from "../lib/nav"

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {adminNav.map((item) => {
        const active = isActive(pathname, item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
              collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
              active
                ? "bg-accent-teal/12 text-accent-teal"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            {active && !collapsed ? (
              <span
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-teal"
                aria-hidden
              />
            ) : null}
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({
  pathname,
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  pathname: string
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}) {
  const { user, signOut } = useAuth()
  return (
    <div className={cn("flex h-full flex-col gap-6 py-4", collapsed ? "px-2" : "px-4")}>
      <div className={cn("flex items-center pt-1", collapsed ? "justify-center" : "justify-between px-2")}>
        {collapsed ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex size-9 items-center justify-center rounded-lg bg-accent-teal/15 text-sm font-bold text-accent-teal ring-1 ring-accent-teal/30"
            aria-label="MOMO admin"
          >
            M
          </Link>
        ) : (
          <>
            <Link href="/admin" onClick={onNavigate} className="text-sm font-bold tracking-[0.35em]">
              MOMO
            </Link>
            <span className="rounded-sm border border-accent-teal/30 bg-accent-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-teal">
              Admin
            </span>
          </>
        )}
      </div>

      <NavLinks pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />

      <div className={cn("mt-auto flex flex-col gap-2 border-t border-border pt-4", collapsed && "items-center")}>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden items-center gap-2 rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground lg:flex",
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
        ) : null}

        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "View storefront" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
            collapsed ? "size-9 justify-center" : "px-3 py-2",
          )}
        >
          <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          {!collapsed && "View storefront"}
        </Link>

        {collapsed ? (
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign out"
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-foreground/5 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{user?.name ?? "Admin"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
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

  const initials = (user?.name ?? "Admin")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 hidden border-r border-border bg-card transition-[width] duration-300 ease-out lg:block",
          collapsed ? "w-[72px]" : "w-60",
        )}
      >
        <SidebarBody
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </button>
            <SidebarBody pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-300 ease-out", collapsed ? "lg:pl-[72px]" : "lg:pl-60")}>
        {/* Top header — section title pinned to the top of the page, under the nav. */}
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
              Welcome back, {(user?.name ?? "Admin").split(" ")[0]}
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

          <span
            className="flex size-9 items-center justify-center rounded-full bg-accent-teal/15 text-xs font-semibold text-accent-teal ring-1 ring-accent-teal/30"
            aria-hidden
          >
            {initials}
          </span>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
