import { DocGridSkeleton } from "@/features/docs"

export default function DocsLoading() {
  return (
    <main className="bg-background">
      <div className="h-[62vh] animate-pulse bg-card/40 md:h-[80vh]" />
      <section className="px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 h-10 w-full max-w-md animate-pulse rounded-full bg-foreground/[0.06]" />
          <DocGridSkeleton />
        </div>
      </section>
    </main>
  )
}
