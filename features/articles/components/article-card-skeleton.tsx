/**
 * Branded loading placeholders for article cards. Shapes mirror ArticleCard
 * (16:10 cover, meta row, title, excerpt, date). Pulse is gated behind
 * `motion-safe` to respect reduced-motion preferences.
 */

export function ArticleCardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.06] motion-safe:animate-pulse" />
      <div className="flex flex-1 flex-col pt-5">
        <div className="h-2.5 w-24 rounded-full bg-foreground/10 motion-safe:animate-pulse" />
        <div className="mt-3 h-5 w-3/4 rounded-md bg-foreground/10 motion-safe:animate-pulse" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
        </div>
        <div className="mt-4 h-3 w-20 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
      </div>
    </div>
  )
}

export function ArticleGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <ArticleCardSkeleton key={index} />
      ))}
    </div>
  )
}
