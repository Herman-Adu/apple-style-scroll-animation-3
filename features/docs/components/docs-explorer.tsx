"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  Code2,
  FileText,
  GitBranch,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Mail,
  Package,
  Rocket,
  RotateCcw,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Truck,
  Users,
  Webhook,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { DocAudience, DocCategory, DocSummary } from "../lib/domain/schema"
import { DOC_AUDIENCES, docAudienceMeta } from "../lib/domain/schema"
import { groupDocsByAudienceAndCategory, visibleDocs } from "../lib/domain/doc"
import { useDocSearch } from "../hooks/use-doc-search"
import { DocCard } from "./doc-card"
import { CategoryDisclosure } from "@/components/category-disclosure"
import { useAuth } from "@/lib/auth/adapters/auth-context"
import { isOwner } from "@/lib/auth/domain/config"
import { cn } from "@/lib/utils"

type AudienceTab = "all" | DocAudience

/** Consistent lucide icon per category — mirrors the icon-led nav treatment. */
const categoryIcon: Record<DocCategory, LucideIcon> = {
  // User guides
  "Getting Started": Rocket,
  "Product Care": Sparkles,
  Troubleshooting: Wrench,
  FAQ: HelpCircle,
  "Warranty & Returns": RotateCcw,
  // Content management
  Catalog: Package,
  "Store Operations": Store,
  "Orders & Fulfillment": Truck,
  Customers: Users,
  "Email & Campaigns": Mail,
  "Media Library": ImageIcon,
  "CMS & Publishing": FileText,
  // Developer
  Architecture: Boxes,
  "Next.js": Code2,
  Migration: GitBranch,
  DevOps: Server,
  Commerce: ShoppingCart,
  "Data & Analytics": BarChart3,
  "Security & Auth": ShieldCheck,
  "API & Integrations": Webhook,
  // CTO & decision makers
  "Business Case": TrendingUp,
  "Technology Strategy": Layers,
  "Security & Trust": BadgeCheck,
  // Owner
  Positioning: Target,
}

/**
 * Role-aware docs explorer. Receives the full corpus as lightweight summaries
 * (no bodies) and, on the client, hides admin-only guides from non-admins. The
 * gating mirrors the admin area's client-side model (localStorage auth); once
 * auth moves server-side with Strapi the same `access` field enforces this on
 * the server and this component keeps working unchanged.
 *
 * Content is organised audience → category, where each non-empty category is a
 * collapsible dropdown so the library scales as more guides land.
 */
export function DocsExplorer({ docs }: { docs: DocSummary[] }) {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const isOwnerViewer = isOwner(user?.email)

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<AudienceTab>("all")
  // Categories the user has expanded. Everything is collapsed by default so the
  // whole library is scannable at a glance; searching force-opens everything so
  // matches are never hidden behind a closed group.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const visible = useMemo(
    () => visibleDocs(docs, { isAdmin, isOwner: isOwnerViewer }),
    [docs, isAdmin, isOwnerViewer],
  )

  // Only offer audience tabs the viewer can actually see content in.
  const availableAudiences = useMemo(
    () => DOC_AUDIENCES.filter((audience) => visible.some((doc) => doc.audience === audience)),
    [visible],
  )

  const { rankedSlugs, snippets } = useDocSearch(visible, query)
  const isSearching = rankedSlugs !== null
  const searched = useMemo(() => {
    if (!rankedSlugs) return visible
    const bySlug = new Map(visible.map((doc) => [doc.slug, doc]))
    return rankedSlugs.map((slug) => bySlug.get(slug)).filter((doc): doc is DocSummary => Boolean(doc))
  }, [visible, rankedSlugs])
  const scoped = tab === "all" ? searched : searched.filter((doc) => doc.audience === tab)
  const groups = useMemo(() => groupDocsByAudienceAndCategory(scoped), [scoped])

  const total = scoped.length

  function toggleCategory(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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

      {total === 0 ? (
        <p className="text-foreground/50">
          {query ? `No guides match “${query}”. Try a different search.` : "No guides here yet."}
        </p>
      ) : (
        <div className="space-y-14">
          {groups.map((group) => (
            <section key={group.audience} aria-labelledby={`docs-${group.audience}`}>
              <div className="mb-6 flex items-baseline gap-3">
                <h2
                  id={`docs-${group.audience}`}
                  className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70"
                >
                  {group.meta.title}
                </h2>
                <span className="font-mono text-[10px] text-foreground/30">
                  {group.count} {group.count === 1 ? "guide" : "guides"}
                </span>
              </div>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-foreground/50">{group.meta.blurb}</p>

              <div className="space-y-3">
                {group.categories.map((cat) => {
                  const key = `${group.audience}:${cat.category}`
                  const open = isSearching || expanded.has(key)
                  return (
                    <CategoryDisclosure
                      key={key}
                      label={cat.category}
                      icon={categoryIcon[cat.category]}
                      count={cat.docs.length}
                      itemLabel="guide"
                      open={open}
                      onToggle={() => toggleCategory(key)}
                    >
                      <div className="grid gap-5 pt-5 md:grid-cols-2 lg:grid-cols-3">
                        {cat.docs.map((doc, index) => (
                          <DocCard key={doc.slug} doc={doc} index={index} snippet={snippets.get(doc.slug)} />
                        ))}
                      </div>
                    </CategoryDisclosure>
                  )
                })}
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
