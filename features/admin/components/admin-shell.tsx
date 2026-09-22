"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth/auth-context"
import { adminNav, isActive } from "../lib/nav"

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
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
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { user, signOut } = useAuth()
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <Link href="/admin" onClick={onNavigate} className="text-sm font-bold tracking-[0.35em]">
          MOMO
        </Link>
        <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Admin
        </span>
      </div>

      <NavLinks pathname={pathname} onNavigate={onNavigate} />

      <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpRight className="size-3.5" aria-hidden />
          View storefront
        </Link>
        <div className="flex items-center justify-between gap-2 rounded-md bg-foreground/5 px-3 py-2">
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
      </div>
    </div>
  )
}

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card lg:block">
        <SidebarBody pathname={pathname} />
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

      <div className="lg:pl-60">
        {/* Mobile-only bar: keeps the drawer toggle. Desktop uses the sidebar for context. */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Admin</span>
        </header>

        <main className="p-4 sm:p-6">
          <header className="mb-6 border-b border-border pb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          </header>
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
