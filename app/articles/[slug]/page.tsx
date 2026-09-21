import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import type { ArticleBlock } from "@/lib/types"
import { fetchArticle, fetchArticleSlugs, fetchMoreArticles } from "@/features/articles/api"
import { ArticleCard, ArticleGridSkeleton } from "@/features/articles"
import { formatDate } from "@/lib/format"
import { JsonLd } from "@/components/seo/json-ld"
import { articleLd, breadcrumbLd } from "@/lib/seo/structured-data"
import { absoluteUrl } from "@/lib/seo/site"

export async function generateStaticParams() {
  const slugs = await fetchArticleSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) return { title: "Article not found" }
  const canonical = `/articles/${article.slug}`
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: absoluteUrl(canonical),
      publishedTime: article.publishedAt,
      authors: [article.author.name],
      section: article.category,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
    },
  }
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="mt-14 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{block.text}</h2>
    case "quote":
      return (
        <blockquote className="my-12 border-l-2 border-foreground/30 pl-6">
          <p className="text-xl font-medium leading-snug text-foreground md:text-2xl">{block.text}</p>
          {block.attribution && (
            <cite className="mt-4 block text-sm not-italic text-foreground/40">— {block.attribution}</cite>
          )}
        </blockquote>
      )
    default:
      return <p className="mt-6 text-lg leading-relaxed text-foreground/70">{block.text}</p>
  }
}

async function MoreArticles({ slug }: { slug: string }) {
  const more = await fetchMoreArticles(slug)
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {more.map((item, index) => (
        <ArticleCard key={item.slug} article={item} index={index} />
      ))}
    </div>
  )
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) notFound()

  return (
    <main className="bg-background pt-32 md:pt-40">
      <JsonLd
        data={[
          articleLd(article),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Articles", path: "/articles" },
            { name: article.title, path: `/articles/${article.slug}` },
          ]),
        ]}
      />
      <article className="px-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground/50 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            All articles
          </Link>

          <div className="mt-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            <span>{article.category}</span>
            <span className="h-1 w-1 rounded-full bg-foreground/30" />
            <span>{article.readingMinutes} min read</span>
          </div>

          <h1 className="mt-5 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
            {article.title}
          </h1>

          <div className="mt-8 flex items-center gap-4 border-b border-foreground/10 pb-8">
            <div>
              <p className="text-sm font-medium text-foreground">{article.author.name}</p>
              <p className="text-xs text-foreground/40">{article.author.role}</p>
            </div>
            <span className="ml-auto text-xs text-foreground/40">{formatDate(article.publishedAt)}</span>
          </div>
        </div>

        <div className="relative mx-auto mt-12 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl border border-foreground/10">
          <Image
            src={article.coverImage || "/placeholder.svg"}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        </div>

        <div className="mx-auto mt-12 max-w-3xl pb-8">
          {article.body.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      </article>

      <section className="border-t border-foreground/10 px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-14 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Keep reading</h2>
          <Suspense fallback={<ArticleGridSkeleton />}>
            <MoreArticles slug={article.slug} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
