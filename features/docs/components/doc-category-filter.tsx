import Link from "next/link"
import { DOC_CATEGORIES } from "../schema"
import { cn } from "@/lib/utils"

/**
 * Server-rendered category filter. Each option is a plain link that sets the
 * `category` param while preserving any active `q` search — so filtering needs
 * zero client JavaScript and stays shareable via URL.
 */
export function DocCategoryFilter({
  active,
  query,
}: {
  active?: string
  query?: string
}) {
  function href(category?: string) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (query) params.set("q", query)
    const qs = params.toString()
    return qs ? `/docs?${qs}` : "/docs"
  }

  const base =
    "rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors"

  return (
    <nav aria-label="Filter docs by category" className="flex flex-wrap gap-2.5">
      <Link
        href={href()}
        className={cn(
          base,
          !active
            ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
            : "border-foreground/15 text-foreground/50 hover:border-foreground/40 hover:text-foreground",
        )}
      >
        All
      </Link>
      {DOC_CATEGORIES.map((category) => {
        const isActive = active === category
        return (
          <Link
            key={category}
            href={href(category)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              base,
              isActive
                ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                : "border-foreground/15 text-foreground/50 hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {category}
          </Link>
        )
      })}
    </nav>
  )
}
