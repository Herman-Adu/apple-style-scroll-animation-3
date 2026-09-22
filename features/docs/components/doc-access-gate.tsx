"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"

/**
 * Client gate for an admin-only doc. Renders children only for an authenticated
 * admin; everyone else sees a locked notice instead of the guide body. Mirrors
 * the admin area's client-side gating (localStorage auth). The detail page still
 * fetches the body on the server today, so this is UX-level gating pre-Strapi;
 * once auth is server-side the same `access` field enforces it before render.
 */
export function DocAccessGate({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth()

  if (status === "loading") {
    return (
      <div className="space-y-4" aria-hidden>
        <div className="h-4 w-full animate-pulse rounded bg-foreground/[0.06]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-foreground/[0.06]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-foreground/[0.06]" />
      </div>
    )
  }

  if (user?.role === "admin") {
    return <>{children}</>
  }

  return (
    <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/[0.06] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent-amber/40 bg-accent-amber/10">
        <Lock className="h-5 w-5 text-accent-amber" strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">This is an internal guide</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/50">
        This guide is for the Momo Audio team. Sign in with an admin account to read it, or browse the public user
        guides instead.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/sign-in"
          className="rounded-full bg-accent-teal px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/docs"
          className="rounded-full border border-foreground/15 px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Browse user guides
        </Link>
      </div>
    </div>
  )
}
