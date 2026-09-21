import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { Doc } from "../schema"
import { Reveal } from "@/components/primitives"

export function DocCard({ doc, index = 0 }: { doc: Doc; index?: number }) {
  return (
    <Reveal delay={index * 0.05} className="h-full">
      <Link
        href={`/docs/${doc.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-card/40 p-6 transition-colors hover:border-accent-teal/40 hover:bg-card/70"
      >
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          <span>{doc.category}</span>
          <span>{doc.readingMinutes} min</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-teal">
          {doc.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/50">{doc.summary}</p>
        <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-foreground/50 transition-colors group-hover:text-foreground">
          Read guide
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.5} />
        </div>
      </Link>
    </Reveal>
  )
}

export function DocCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-foreground/10 bg-card/40 p-6">
      <div className="h-3 w-24 animate-pulse rounded bg-foreground/10" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-foreground/10" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-foreground/[0.06]" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-foreground/[0.06]" />
    </div>
  )
}

export function DocGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocCardSkeleton key={i} />
      ))}
    </div>
  )
}
