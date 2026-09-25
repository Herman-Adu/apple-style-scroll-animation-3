"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/admin/email", label: "Overview", exact: true },
  { href: "/admin/email/templates", label: "Templates" },
  { href: "/admin/email/campaigns", label: "Campaigns" },
  { href: "/admin/email/messages", label: "Messages" },
  { href: "/admin/email/settings", label: "Settings" },
]

/** Horizontal section switcher shown at the top of every Email admin page. */
export function EmailTabs() {
  const pathname = usePathname()
  return (
    <div className="mb-6 overflow-x-auto">
      <nav className="flex min-w-max items-center gap-1 border-b border-border" aria-label="Email sections">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative -mb-px whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-accent-teal"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-teal" aria-hidden />
              ) : null}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
