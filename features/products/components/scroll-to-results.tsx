"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Brings the filtered results into view when the category or search filter
 * changes, so the grid update is visible instead of leaving the user on the
 * hero. On the very first render it only jumps when the page was opened with an
 * active filter — a bare `/products` landing keeps its hero in view.
 */
export function ScrollToResults({ targetId }: { targetId: string }) {
  const searchParams = useSearchParams()
  const category = searchParams.get("category") ?? ""
  const query = searchParams.get("q") ?? ""
  const firstRender = useRef(true)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    if (firstRender.current) {
      firstRender.current = false
      if (!category && !query) return
      target.scrollIntoView({ block: "start" })
      return
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [category, query, targetId])

  return null
}
