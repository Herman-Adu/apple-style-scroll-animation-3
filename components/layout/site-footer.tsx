import Link from "next/link"
import { footerNav, siteConfig } from "@/lib/data/site"

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">{siteConfig.shortName}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-foreground/40">{siteConfig.description}</p>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-foreground/30">{siteConfig.location}</p>
          </div>

          {footerNav.map((group) => (
            <div key={group.title}>
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">{group.title}</p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/60 transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/10 pt-8 text-xs text-foreground/30">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-foreground/60">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground/60">
              Terms
            </Link>
            <Link href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-foreground/60">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
