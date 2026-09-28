"use client"

import type { MouseEvent } from "react"
import { cn } from "@/lib/utils"
import { useActiveSection } from "@/hooks/use-active-section"

export interface PageTocItem {
  id: string
  label: string
}

/**
 * The single "On this page" rail shared by the legal pages and the docs reader.
 * Themed hover + scroll-spy active states: the active link picks up the brand
 * accent (`text-accent-teal` + a solid accent rail), so it re-themes with the
 * rest of the site. Anchors still work without JS; the click handler only adds
 * smooth scrolling and keeps the URL hash in sync. Ids that are not on the
 * current page are ignored by `useActiveSection`, so one list is always safe.
 */
export function PageToc({
  items,
  title = "On this page",
  className,
}: {
  items: PageTocItem[]
  title?: string
  className?: string
}) {
  const activeId = useActiveSection(items.map((i) => i.id))

  function handleClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    const el = document.getElementById(id)
    if (!el) return
    event.preventDefault()
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    history.replaceState(null, "", `#${id}`)
  }

  if (items.length === 0) return null

  return (
    <nav aria-label={title} className={cn("sticky top-28", className)}>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">{title}</p>
      <ul className="flex flex-col border-l border-foreground/10">
        {items.map((item) => {
          const active = activeId === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => handleClick(event, item.id)}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px block border-l py-1.5 pl-4 text-sm leading-snug transition-colors",
                  active
                    ? "border-accent-teal text-accent-teal"
                    : "border-transparent text-foreground/50 hover:border-accent-teal/60 hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
