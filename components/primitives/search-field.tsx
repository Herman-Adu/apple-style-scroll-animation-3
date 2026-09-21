"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Client island for text search. It owns only the input; the actual filtering
 * happens server-side in the page (RSC) that reads the `q` search param. On
 * change it debounces, then updates the URL — preserving any other params
 * (e.g. `category`) — so results stay shareable, back/forward works, and no
 * data or list rendering ships to the client.
 */
export function SearchField({
  placeholder = "Search…",
  paramKey = "q",
  label,
  className,
  debounceMs = 300,
}: {
  placeholder?: string
  paramKey?: string
  /** Accessible label for the input (visually hidden). */
  label: string
  className?: string
  debounceMs?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const initial = searchParams.get(paramKey) ?? ""
  const [value, setValue] = useState(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the input in sync when the param changes elsewhere (e.g. back button).
  useEffect(() => {
    setValue(searchParams.get(paramKey) ?? "")
  }, [searchParams, paramKey])

  function commit(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = next.trim()
    if (trimmed) params.set(paramKey, trimmed)
    else params.delete(paramKey)
    const query = params.toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  function onChange(next: string) {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(next), debounceMs)
  }

  function clear() {
    if (timer.current) clearTimeout(timer.current)
    setValue("")
    commit("")
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-full border border-foreground/15 bg-foreground/[0.03] px-5 py-3 transition-colors focus-within:border-foreground/40",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-foreground/40" strokeWidth={1.5} aria-hidden />
      ) : (
        <Search className="h-4 w-4 shrink-0 text-foreground/40" strokeWidth={1.5} aria-hidden />
      )}
      <input
        type="search"
        inputMode="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/35 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="rounded-full p-0.5 text-foreground/40 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal/60"
        >
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  )
}
