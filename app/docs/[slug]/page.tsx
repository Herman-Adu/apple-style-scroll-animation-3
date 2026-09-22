import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Clock, Lock } from "lucide-react"
import { DocAccessGate, DocBlocks, DocsSidebar, getDocHeadings, toDocSummary } from "@/features/docs"
import { fetchDoc, fetchDocs, fetchDocSlugs, fetchRelatedDocs } from "@/features/docs/api"

export async function generateStaticParams() {
  const slugs = await fetchDocSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = await fetchDoc(slug)
  if (!doc) return { title: "Not found" }
  return {
    title: doc.title,
    description: doc.summary,
    openGraph: { title: doc.title, description: doc.summary, type: "article" },
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = await fetchDoc(slug)
  if (!doc) notFound()

  const headings = getDocHeadings(doc)
  const related = await fetchRelatedDocs(slug)
  // Card-level summaries only (no bodies) power the role-aware nav rail.
  const allSummaries = (await fetchDocs()).map(toDocSummary)

  return (
    <main className="bg-background">
      <article className="px-6 pt-32 pb-20 md:px-12 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Documentation
          </Link>

          {/* Nav rail · reading column · on-this-page TOC */}
          <div className="mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[15rem_minmax(0,1fr)_14rem]">
            <aside className="hidden lg:block">
              <DocsSidebar docs={allSummaries} activeSlug={slug} />
            </aside>

            <div className="min-w-0">
              <header className="border-b border-foreground/10 pb-10">
                <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  <span className="rounded-full border border-accent-teal/40 px-3 py-1 text-accent-teal">
                    {doc.category}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {doc.readingMinutes} min read
                  </span>
                  {doc.access === "admin" ? (
                    <span className="flex items-center gap-1 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-3 py-1 text-accent-amber">
                      <Lock className="h-2.5 w-2.5" strokeWidth={2} />
                      Internal
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-5xl">
                  {doc.title}
                </h1>
                <p className="mt-5 text-pretty text-lg leading-relaxed text-foreground/60">{doc.summary}</p>
              </header>

              <div className="mt-10">
                {doc.access === "admin" ? (
                  <DocAccessGate>
                    <DocBlocks blocks={doc.body} />
                  </DocAccessGate>
                ) : (
                  <DocBlocks blocks={doc.body} />
                )}
              </div>

              <div className="mt-16 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">Tags</span>
                {doc.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-foreground/[0.05] px-3 py-1 text-xs text-foreground/50">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {headings.length > 1 && (
              <aside className="hidden xl:block">
                <nav aria-label="On this page" className="sticky top-28">
                  <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    On this page
                  </p>
                  <ul className="space-y-2.5 border-l border-foreground/10">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className="-ml-px block border-l border-transparent pl-4 text-sm leading-snug text-foreground/50 transition-colors hover:border-accent-teal hover:text-foreground"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-foreground/10 px-6 py-16 md:px-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Related guides
            </h2>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/docs/${r.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-card/40 p-6 transition-colors hover:border-accent-teal/40 hover:bg-card/70"
                >
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    <span>{r.category}</span>
                    <span>{r.readingMinutes} min</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-teal">
                    {r.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/50">{r.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-foreground/50 transition-colors group-hover:text-foreground">
                    Read guide
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
