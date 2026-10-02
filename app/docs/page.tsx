import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { pageHeroes } from "@/lib/data/heroes"
import { DocsExplorer, toDocSummary, canViewDoc } from "@/features/docs"
import { fetchDocs } from "@/features/docs/server"
import { getServerRole, getServerIsOwner } from "@/lib/auth/server"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Help and guides for Momo Audio: setup and device user guides, plus content-management and engineering references — all publicly available.",
}

export default async function DocsPage() {
  const all = await fetchDocs()
  const [role, isOwner] = await Promise.all([getServerRole(), getServerIsOwner()])
  const isAdmin = role === "admin"
  const viewer = { isAdmin, isOwner }
  // Ship only card-level summaries to the client explorer — never full doc
  // bodies. Flattened body text (for full-text search) is attached only for
  // docs this viewer may read, so admin content never reaches non-admin
  // browsers even as a search string. Owner-only cards are dropped entirely for
  // non-owners so their titles/summaries never reach other browsers either.
  const summaries = all
    .filter((doc) => doc.access !== "owner" || isOwner)
    .map((doc) => toDocSummary(doc, canViewDoc(doc, viewer)))

  return (
    <main className="bg-background">
      <PageHero content={pageHeroes.docs} />

      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <DocsExplorer docs={summaries} />
        </div>
      </section>
    </main>
  )
}
