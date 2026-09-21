"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { siteConfig } from "@/lib/data/site"

/** Shared centered shell for sign-in / sign-up so both pages stay visually identical. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-foreground/[0.06] blur-[120px]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.35em] text-foreground/70 transition-opacity hover:opacity-70"
          >
            {siteConfig.shortName}
          </Link>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-foreground/40">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground text-balance">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground/50">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-foreground/50">{footer}</div>
      </motion.div>
    </main>
  )
}
