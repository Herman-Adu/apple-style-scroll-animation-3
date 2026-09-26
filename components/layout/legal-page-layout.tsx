import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { LegalBlock, LegalPageContent } from "@/lib/data/legal"
import { siteConfig } from "@/lib/data/site"

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") {
    return <p className="text-base leading-relaxed text-foreground/60">{block}</p>
  }
  return (
    <ul className="flex flex-col gap-3">
      {block.items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed text-foreground/60">
          <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function LegalPageLayout({ content }: { content: LegalPageContent }) {
  return (
    <main className="bg-background">
      {/* Header */}
      <section className="border-b border-foreground/10 px-6 pt-32 pb-16 md:px-12 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/40">{content.eyebrow}</p>
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
            {content.title}
          </h1>
          <p className="mt-8 max-w-2xl text-pretty text-xl leading-relaxed text-foreground/60">{content.intro}</p>
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/30">
            Last updated · {content.updated}
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto grid max-w-5xl gap-16 lg:grid-cols-[220px_1fr]">
          {/* TOC */}
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">On this page</p>
              <ul className="flex flex-col gap-3">
                {content.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-foreground/50 transition-colors hover:text-foreground"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Sections */}
          <div className="min-w-0">
            {content.disclaimer ? (
              <div className="mb-12 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">Please note</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">{content.disclaimer}</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-14">
              {content.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {section.heading}
                  </h2>
                  <div className="mt-5 flex flex-col gap-4">
                    {section.blocks.map((block, index) => (
                      <Block key={index} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="mt-16 flex flex-col gap-4 border-t border-foreground/10 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-foreground/60">Still have a question? Our team is happy to help.</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Contact us
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
