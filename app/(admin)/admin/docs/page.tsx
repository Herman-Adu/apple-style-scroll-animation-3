import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AdminShell } from "@/features/admin"
import { DocsExplorer, toDocSummary, canViewDoc } from "@/features/docs"
import { fetchDocs } from "@/features/docs/server"
import { getServerRole, getServerIsOwner } from "@/lib/auth/server"

/**
 * The full documentation library embedded inside the admin dashboard chrome.
 * Every guide is now public on the storefront `/docs` landing; this in-dashboard
 * view mirrors that library and additionally surfaces the owner-only positioning
 * material for the owner alone. The page sits behind AdminGuard (see the
 * route-group layout), so the viewer is always an admin; body text for full-text
 * search is attached per `canViewDoc`, keeping the same gating contract as the
 * public explorer.
 */
export default async function AdminDocsPage() {
  const all = await fetchDocs()
  const [role, isOwner] = await Promise.all([getServerRole(), getServerIsOwner()])
  const isAdmin = role === "admin"
  const viewer = { isAdmin, isOwner }

  // The full library in dashboard chrome. Owner-only guides are included for the
  // owner alone — never serialize owner card metadata to other admins' browsers.
  const libraryDocs = all.filter((doc) => doc.access !== "owner" || isOwner)
  const summaries = libraryDocs.map((doc) => toDocSummary(doc, canViewDoc(doc, viewer)))

  return (
    <AdminShell title="Documentation">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/60 text-pretty">
          The complete documentation library — user, content-management, and engineering guides — all now public on the
          storefront. This dashboard view also surfaces your owner-only positioning and go-to-market material.
        </p>
        <Link
          href="/docs"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-foreground/15 bg-card/40 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/60 transition-colors hover:border-accent-teal/50 hover:text-accent-teal"
        >
          Public docs
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </Link>
      </div>

      <DocsExplorer docs={summaries} />
    </AdminShell>
  )
}
