import Link from "next/link"
import { ArrowUpRight, Lock } from "lucide-react"
import type { DocSummary } from "../schema"
import { Reveal } from "@/components/primitives"

export function DocCard({ doc, index = 0, snippet }: { doc: DocSummary; index?: number; snippet?: string }) {
  const isAdmin = doc.access === "admin"
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
        {snippet ? (
          <p className="mt-3 border-l-2 border-accent-teal/40 pl-3 text-xs leading-relaxed text-foreground/45">
            <span className="mr-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-accent-teal/70">Match</span>
            {snippet}
          </p>
        ) : null}
        <div className="mt-5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 transition-colors group-hover:text-foreground">
            Read guide
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
            />
          </span>
          {isAdmin ? (
            <span className="flex items-center gap-1 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent-amber">
              <Lock className="h-2.5 w-2.5" strokeWidth={2} />
              Internal
            </span>
          ) : null}
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
