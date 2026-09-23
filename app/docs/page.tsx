import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { pageHeroes } from "@/lib/data/heroes"
import { DocsExplorer, toDocSummary, canViewDoc } from "@/features/docs"
import { fetchDocs } from "@/features/docs/api"
import { getServerRole } from "@/lib/auth/server"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Help and guides for Momo Audio: user guides for your devices, plus internal content-management and engineering references for the team.",
}

export default async function DocsPage() {
  const all = await fetchDocs()
  const role = await getServerRole()
  const isAdmin = role === "admin"
  // Ship only card-level summaries to the client explorer — never full doc
  // bodies. Flattened body text (for full-text search) is attached only for
  // docs this viewer may read, so admin content never reaches non-admin
  // browsers even as a search string.
  const summaries = all.map((doc) => toDocSummary(doc, canViewDoc(doc, isAdmin)))

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
