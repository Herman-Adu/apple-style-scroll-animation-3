"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent-teal">Something broke</p>
      <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
        A note fell out of tune.
      </h1>
      <p className="mt-4 max-w-md text-pretty leading-relaxed text-foreground/60">
        An unexpected error interrupted this page. You can try again, or head back to safe ground.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-foreground/15 px-6 py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Back home
        </Link>
      </div>
    </main>
  )
}
