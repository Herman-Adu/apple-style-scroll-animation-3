/**
 * Branded loading placeholders for product cards. Shapes mirror ProductCard
 * (4:5 image, category label, title, summary, price) so the layout does not
 * shift when the real cards stream in. The pulse is gated behind `motion-safe`
 * so it stays still for users who prefer reduced motion.
 */

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.02]">
      <div className="relative aspect-[4/5] overflow-hidden bg-foreground/[0.06] motion-safe:animate-pulse">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ background: "radial-gradient(circle at 50% 40%, var(--accent-teal), transparent 65%)" }}
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="h-2.5 w-16 rounded-full bg-foreground/10 motion-safe:animate-pulse" />
        <div className="mt-3 h-5 w-32 rounded-md bg-foreground/10 motion-safe:animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
        </div>
        <div className="mt-6 h-5 w-20 rounded-md bg-foreground/10 motion-safe:animate-pulse" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}
