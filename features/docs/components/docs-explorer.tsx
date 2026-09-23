"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Code2,
  FileText,
  GitBranch,
  HelpCircle,
  Image as ImageIcon,
  Lock,
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
  Truck,
  Users,
  Webhook,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { DocAudience, DocCategory, DocSummary } from "../schema"
import { DOC_AUDIENCES, docAudienceMeta } from "../schema"
import { groupDocsByAudienceAndCategory, visibleDocs } from "../lib/doc"
import { useDocSearch } from "../lib/use-doc-search"
import { DocCard } from "./doc-card"
import { useAuth } from "@/lib/auth/auth-context"
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
  // Developer & CTO
  Architecture: Boxes,
  "Next.js": Code2,
  Migration: GitBranch,
  DevOps: Server,
  Commerce: ShoppingCart,
  "Data & Analytics": BarChart3,
  "Security & Auth": ShieldCheck,
  "API & Integrations": Webhook,
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

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<AudienceTab>("all")
  // Categories collapsed by the user. Everything is open by default; searching
  // force-opens everything so matches are never hidden behind a closed group.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const visible = useMemo(() => visibleDocs(docs, isAdmin), [docs, isAdmin])

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
    setCollapsed((prev) => {
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
                {group.meta.access === "admin" ? (
                  <span className="flex items-center gap-1 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent-amber">
                    <Lock className="h-2.5 w-2.5" strokeWidth={2} />
                    Internal
                  </span>
                ) : null}
                <span className="font-mono text-[10px] text-foreground/30">
                  {group.count} {group.count === 1 ? "guide" : "guides"}
                </span>
              </div>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-foreground/50">{group.meta.blurb}</p>

              <div className="space-y-3">
                {group.categories.map((cat) => {
                  const key = `${group.audience}:${cat.category}`
                  const open = isSearching || !collapsed.has(key)
                  return (
                    <CategoryDisclosure
                      key={key}
                      category={cat.category}
                      count={cat.docs.length}
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

function CategoryDisclosure({
  category,
  count,
  open,
  onToggle,
  children,
}: {
  category: DocCategory
  count: number
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const Icon = categoryIcon[category]
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card/30 px-4 py-1 transition-colors hover:border-foreground/20">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full items-center gap-3 py-4 text-left"
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
              open
                ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                : "border-foreground/10 bg-foreground/[0.03] text-foreground/50 group-hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-foreground">{category}</span>
          </span>
          <span className="font-mono text-[10px] text-foreground/30">
            {count} {count === 1 ? "guide" : "guides"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-200",
              open && "rotate-180 text-accent-teal",
            )}
            strokeWidth={2}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
