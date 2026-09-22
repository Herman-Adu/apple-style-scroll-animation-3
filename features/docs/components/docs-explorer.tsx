"use client"

import { useMemo, useState } from "react"
import { Lock, Search } from "lucide-react"
import type { DocAudience, DocSummary } from "../schema"
import { DOC_AUDIENCES, docAudienceMeta } from "../schema"
import { filterDocs, groupDocsByAudience, visibleDocs } from "../lib/doc"
import { DocCard } from "./doc-card"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

type AudienceTab = "all" | DocAudience

/**
 * Role-aware docs explorer. Receives the full corpus as lightweight summaries
 * (no bodies) and, on the client, hides admin-only guides from non-admins. The
 * gating mirrors the admin area's client-side model (localStorage auth); once
 * auth moves server-side with Strapi the same `access` field enforces this on
 * the server and this component keeps working unchanged.
 */
export function DocsExplorer({ docs }: { docs: DocSummary[] }) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<AudienceTab>("all")

  const visible = useMemo(() => visibleDocs(docs, isAdmin), [docs, isAdmin])

  // Only offer audience tabs the viewer can actually see content in.
  const availableAudiences = useMemo(
    () => DOC_AUDIENCES.filter((audience) => visible.some((doc) => doc.audience === audience)),
    [visible],
  )

  const searched = useMemo(() => filterDocs(visible, query), [visible, query])
  const scoped = tab === "all" ? searched : searched.filter((doc) => doc.audience === tab)
  const groups = useMemo(() => groupDocsByAudience(scoped), [scoped])

  const total = scoped.length

  return (
    <div>
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <AudienceTabs
          tab={tab}
          onChange={setTab}
          audiences={availableAudiences}
          showTabs={availableAudiences.length > 1}
        />
        <label className="relative w-full lg:w-80">
          <span className="sr-only">Search documentation</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides…"
            className="w-full rounded-full border border-foreground/15 bg-card/40 py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-teal/50"
          />
        </label>
      </div>

      {!isAdmin ? (
        <p className="mb-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          <Lock className="h-3 w-3" strokeWidth={2} />
          Showing public user guides — sign in with an admin account for internal guides
        </p>
      ) : null}

      {total === 0 ? (
        <p className="text-foreground/50">
          {query ? `No guides match “${query}”. Try a different search.` : "No guides here yet."}
        </p>
      ) : (
        <div className="space-y-16">
          {groups.map((group) => (
            <section key={group.audience} aria-labelledby={`docs-${group.audience}`}>
              <div className="mb-6 flex items-baseline gap-3">
                <h2
                  id={`docs-${group.audience}`}
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70"
                >
                  {group.meta.title}
                </h2>
                {group.meta.access === "admin" ? (
                  <span className="flex items-center gap-1 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent-amber">
                    <Lock className="h-2.5 w-2.5" strokeWidth={2} />
                    Internal
                  </span>
                ) : null}
                <span className="font-mono text-[10px] text-foreground/30">
                  {group.docs.length} {group.docs.length === 1 ? "guide" : "guides"}
                </span>
              </div>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-foreground/50">{group.meta.blurb}</p>
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {group.docs.map((doc, index) => (
                  <DocCard key={doc.slug} doc={doc} index={index} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function AudienceTabs({
  tab,
  onChange,
  audiences,
  showTabs,
}: {
  tab: AudienceTab
  onChange: (tab: AudienceTab) => void
  audiences: DocAudience[]
  showTabs: boolean
}) {
  if (!showTabs) return <div />

  const base = "rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors"
  const activeClass = "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
  const idleClass = "border-foreground/15 text-foreground/50 hover:border-foreground/40 hover:text-foreground"

  return (
    <nav aria-label="Filter docs by audience" className="flex flex-wrap gap-2.5">
      <button type="button" onClick={() => onChange("all")} className={cn(base, tab === "all" ? activeClass : idleClass)}>
        All
      </button>
      {audiences.map((audience) => (
        <button
          key={audience}
          type="button"
          onClick={() => onChange(audience)}
          aria-current={tab === audience ? "true" : undefined}
          className={cn(base, tab === audience ? activeClass : idleClass)}
        >
          {docAudienceMeta[audience].label}
        </button>
      ))}
    </nav>
  )
}
