import Link from "next/link"
import { footerNav, siteConfig } from "@/lib/data/site"

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        {/*
          Mobile & tablet: brand spans the full width at the top and is centered,
          then the four link groups sit centered in a 2×2 grid beneath it.
          Large screens: brand keeps its wider column (left-aligned) and the four
          groups line up as four equal columns to its right.
        */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] lg:gap-12">
          <div className="col-span-2 text-center lg:col-span-1 lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">{siteConfig.shortName}</p>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/40 lg:mx-0 lg:max-w-xs">
              {siteConfig.description}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/30">{siteConfig.location}</p>
          </div>

          {footerNav.map((group) => (
            <div key={group.title} className="text-center lg:text-left">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">{group.title}</p>
              <ul className="flex flex-col items-center gap-3 lg:items-start">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/60 transition-colors hover:text-accent-teal"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-foreground/10 pt-8 text-xs text-foreground/30 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-accent-teal">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-accent-teal">
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
