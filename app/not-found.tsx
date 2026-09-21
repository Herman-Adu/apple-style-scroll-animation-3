import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-teal">404</p>
      <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl">
        This page went{" "}
        <span className="bg-gradient-to-r from-foreground to-accent-teal bg-clip-text text-transparent">silent</span>.
      </h1>
      <p className="mt-4 max-w-md text-pretty leading-relaxed text-foreground/60">
        The page you are looking for does not exist or has moved. Let us point you back to the music.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Back home
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Browse products
        </Link>
      </div>
    </main>
  )
}
