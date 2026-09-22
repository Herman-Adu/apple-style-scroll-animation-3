import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { pageHeroes } from "@/lib/data/heroes"
import { DocsExplorer, toDocSummary } from "@/features/docs"
import { fetchDocs } from "@/features/docs/api"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Help and guides for Momo Audio: user guides for your devices, plus internal content-management and engineering references for the team.",
}

export default async function DocsPage() {
  const all = await fetchDocs()
  // Ship only card-level summaries to the client explorer — never doc bodies,
  // so admin-only guide content is never sent to non-admin browsers.
  const summaries = all.map(toDocSummary)

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
