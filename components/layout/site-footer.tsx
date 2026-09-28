"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { footerNav, siteConfig } from "@/lib/data/site"
import { cn } from "@/lib/utils"

export function SiteFooter() {
  const pathname = usePathname()

  return (
    <footer className="relative z-10 border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        {/*
          Mobile & tablet: brand spans the full width at the top, then the four
          link groups sit in a 2×2 grid beneath it.
          Large screens: brand keeps its wider column and the four groups line up
          as four equal columns to its right.
        */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">{siteConfig.shortName}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/40">{siteConfig.description}</p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/30">{siteConfig.location}</p>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">{group.title}</p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => {
                  const active = link.href === pathname
                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "text-sm transition-colors hover:text-accent-teal",
                          active ? "text-accent-teal" : "text-foreground/60",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-foreground/10 pt-8 text-xs text-foreground/30 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              aria-current={pathname === "/privacy" ? "page" : undefined}
              className={cn(
                "transition-colors hover:text-accent-teal",
                pathname === "/privacy" && "text-accent-teal",
              )}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              aria-current={pathname === "/terms" ? "page" : undefined}
              className={cn(
                "transition-colors hover:text-accent-teal",
                pathname === "/terms" && "text-accent-teal",
              )}
            >
              Terms
            </Link>
            <Link href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-accent-teal">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
