export default function DocLoading() {
  return (
    <main className="bg-background px-6 pt-32 pb-20 md:px-12 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <div className="h-3 w-32 animate-pulse rounded bg-foreground/10" />
        <div className="mt-8 flex gap-4">
          <div className="h-6 w-24 animate-pulse rounded-full bg-foreground/10" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-foreground/[0.06]" />
        </div>
        <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-foreground/10" />
        <div className="mt-4 h-4 w-full animate-pulse rounded bg-foreground/[0.06]" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-foreground/[0.05]" />
          ))}
        </div>
      </div>
    </main>
  )
}
