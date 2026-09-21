/**
 * Route-level loading UI for an article detail page. Mirrors the article
 * header + cover + body rhythm so the transition into the real content is
 * seamless. Pulse respects reduced-motion via `motion-safe`.
 */
export default function Loading() {
  return (
    <main className="bg-background pt-32 md:pt-40">
      <div className="px-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="h-3 w-24 rounded-full bg-foreground/10 motion-safe:animate-pulse" />
          <div className="mt-10 h-3 w-40 rounded bg-foreground/[0.07] motion-safe:animate-pulse" />
          <div className="mt-5 space-y-3">
            <div className="h-10 w-full rounded-lg bg-foreground/10 motion-safe:animate-pulse" />
            <div className="h-10 w-2/3 rounded-lg bg-foreground/10 motion-safe:animate-pulse" />
          </div>
          <div className="mt-8 h-14 border-b border-foreground/10" />
        </div>

        <div className="relative mx-auto mt-12 aspect-[16/9] max-w-5xl overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/[0.05] motion-safe:animate-pulse" />

        <div className="mx-auto mt-12 max-w-3xl space-y-4 pb-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-3 rounded bg-foreground/[0.07] motion-safe:animate-pulse"
              style={{ width: `${90 - (index % 3) * 15}%` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
