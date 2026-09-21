"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

/**
 * Tracks which of the given section ids is currently in view.
 *
 * Uses a deterministic top-edge test rather than a middle-of-viewport band:
 * the active section is the last one whose top has scrolled above a line just
 * below the fixed header. This avoids the "off by one" you get with short
 * sections (where a mid-viewport band lands on the *next* section), and it
 * behaves correctly on pages whose sections are shorter than the viewport.
 *
 * Only ids that actually exist on the current page are considered, so a single
 * shared list across the whole nav is safe — off-page ids are ignored.
 */
export function useActiveSection(ids: string[]): string | null {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)
  const key = ids.join(",")

  useEffect(() => {
    // Sections present on this page, kept in nav (document) order.
    const present = ids.filter((id) => document.getElementById(id))
    if (present.length === 0) {
      setActiveId(null)
      return
    }

    // Decision line: just below the fixed header.
    const OFFSET = 120

    const compute = () => {
      // At the very bottom of the page, force the last section active so the
      // final short section can always be reached.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (scrolledToBottom) {
        setActiveId(present[present.length - 1])
        return
      }

      // Nothing is active until the first section has scrolled under the
      // header line. At the top of the page (hero in view) no sub-link lights.
      let current: string | null = null
      for (const id of present) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= OFFSET) current = id
        else break
      }
      setActiveId(current)
    }

    compute()
    window.addEventListener("scroll", compute, { passive: true })
    window.addEventListener("resize", compute)
    return () => {
      window.removeEventListener("scroll", compute)
      window.removeEventListener("resize", compute)
    }
    // Re-run when the id set or the route changes (new page = new sections).
  }, [key, pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return activeId
}
