import type { Metadata } from "next"
import { Suspense } from "react"
import { ArticleCard, ArticleCardSkeleton, ArticleGridSkeleton, filterArticles } from "@/features/articles"
import { fetchArticles } from "@/features/articles/api"
import { pageHeroes } from "@/lib/data/heroes"
import { PageHero } from "@/components/layout/page-hero"
import { SearchField } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Articles",
  description: "Field notes on sound, craft, and engineering from the Momo lab.",
}

async function ArticleFeed({ query }: { query?: string }) {
  const articles = await fetchArticles()

  // When searching, show a flat, ranked-by-relevance-order grid with a count.
  if (query) {
    const results = filterArticles(articles, query)
    if (results.length === 0) {
      return (
        <p className="text-foreground/50">{`No articles match “${query}”. Try a different search.`}</p>
      )
    }
    return (
      <>
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {results.map((article, index) => (
            <ArticleCard key={article.slug} article={article} index={index} />
          ))}
        </div>
      </>
    )
  }

  const [lead, ...rest] = articles
  return (
    <>
      {lead && (
        <div className="mb-12">
          <ArticleCard article={lead} index={0} />
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-3">
        {rest.map((article, index) => (
          <ArticleCard key={article.slug} article={article} index={index + 1} />
        ))}
      </div>
    </>
  )
}

function ArticleFeedSkeleton() {
  return (
    <>
      <div className="mb-12">
        <ArticleCardSkeleton />
      </div>
      <ArticleGridSkeleton count={6} />
    </>
  )
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || undefined

  return (
    <main className="bg-background">
      <PageHero content={pageHeroes.articles} />

      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex justify-end">
            <SearchField label="Search articles" placeholder="Search articles…" className="w-full sm:w-80" />
          </div>

          <Suspense key={query ?? "all"} fallback={<ArticleFeedSkeleton />}>
            <ArticleFeed query={query} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
