"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import type { DocSummary } from "../schema"
import { groupDocsByAudience, visibleDocs } from "../lib/doc"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

/**
 * Persistent docs navigation rail. Receives the full corpus as summaries and,
 * on the client, hides admin-only guides from non-admins — mirroring the
 * DocsExplorer gating model so a non-admin never sees internal guides listed.
 * Bodies are never shipped here; only card-level metadata.
 */
export function DocsSidebar({ docs, activeSlug }: { docs: DocSummary[]; activeSlug: string }) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const groups = groupDocsByAudience(visibleDocs(docs, isAdmin))

  return (
    <nav aria-label="All documentation" className="sticky top-28 space-y-8">
      {groups.map((group) => (
        <div key={group.audience}>
          <p className="mb-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            {group.meta.title}
            {group.meta.access === "admin" ? (
              <Lock className="h-2.5 w-2.5 text-accent-amber" strokeWidth={2} />
            ) : null}
          </p>
          <ul className="space-y-1 border-l border-foreground/10">
            {group.docs.map((doc) => {
              const active = doc.slug === activeSlug
              return (
                <li key={doc.slug}>
                  <Link
                    href={`/docs/${doc.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-ml-px block border-l py-1 pl-4 text-sm leading-snug transition-colors",
                      active
                        ? "border-accent-teal font-medium text-foreground"
                        : "border-transparent text-foreground/50 hover:border-foreground/40 hover:text-foreground",
                    )}
                  >
                    {doc.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
