/**
 * Route-level loading UI for a product detail page. The primary product must
 * resolve before the story hero can render, so this branded skeleton gives
 * immediate feedback during that fetch (meaningful once Strapi adds latency).
 */
export default function Loading() {
  return (
    <main className="bg-background">
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-foreground/[0.04] motion-safe:animate-pulse" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ background: "radial-gradient(circle at 50% 45%, var(--accent-teal), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-3 w-24 rounded-full bg-foreground/10 motion-safe:animate-pulse" />
          <div className="h-12 w-64 rounded-xl bg-foreground/10 motion-safe:animate-pulse" />
          <div className="h-4 w-40 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
        </div>
      </div>

      <section className="border-t border-foreground/10 px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="aspect-square rounded-3xl border border-foreground/10 bg-foreground/[0.05] motion-safe:animate-pulse" />
          <div className="space-y-5">
            <div className="h-3 w-20 rounded-full bg-foreground/10 motion-safe:animate-pulse" />
            <div className="h-9 w-3/4 rounded-lg bg-foreground/10 motion-safe:animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
            </div>
            <div className="h-12 w-full rounded-full bg-foreground/[0.05] motion-safe:animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  )
}
