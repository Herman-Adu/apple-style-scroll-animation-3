import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHero } from "@/components/layout/page-hero"
import { SearchField } from "@/components/primitives"
import { pageHeroes } from "@/lib/data/heroes"
import { DocCard, DocGridSkeleton, filterDocs, filterDocsByCategory, groupDocsByCategory } from "@/features/docs"
import { DocCategoryFilter } from "@/features/docs/components/doc-category-filter"
import { fetchDocs } from "@/features/docs/api"

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "The engineering and platform library: server-first architecture, the Strapi migration, DevOps, commerce, and go-to-market guides.",
}

async function DocLibrary({ query, category }: { query?: string; category?: string }) {
  const all = await fetchDocs()
  const filtered = filterDocs(filterDocsByCategory(all, category), query)

  if (filtered.length === 0) {
    return (
      <p className="text-foreground/50">
        {query
          ? `No guides match “${query}”${category ? ` in ${category}` : ""}. Try a different search.`
          : "No guides in this category yet."}
      </p>
    )
  }

  // Searching or a single category → flat grid with a count. Otherwise group.
  if (query || category) {
    return (
      <>
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          {filtered.length} {filtered.length === 1 ? "guide" : "guides"}
          {query ? ` for “${query}”` : ""}
          {category ? ` in ${category}` : ""}
        </p>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc, index) => (
            <DocCard key={doc.slug} doc={doc} index={index} />
          ))}
        </div>
      </>
    )
  }

  const groups = groupDocsByCategory(filtered)
  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.category}>
          <div className="mb-6 flex items-baseline gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground/70">{group.category}</h2>
            <span className="font-mono text-[10px] text-foreground/30">
              {group.docs.length} {group.docs.length === 1 ? "guide" : "guides"}
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {group.docs.map((doc, index) => (
              <DocCard key={doc.slug} doc={doc} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams
  const query = q?.trim() || undefined

  return (
    <main className="bg-background">
      <PageHero content={pageHeroes.docs} />

      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <DocCategoryFilter active={category} query={query} />
            <SearchField label="Search documentation" placeholder="Search guides…" className="w-full md:w-80" />
          </div>

          <Suspense key={`${query ?? "all"}-${category ?? "all"}`} fallback={<DocGridSkeleton />}>
            <DocLibrary query={query} category={category} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
