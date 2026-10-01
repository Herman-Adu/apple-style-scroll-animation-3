"use client"

import { useEffect, useRef } from "react"

/**
 * Re-run `refresh` on an interval while the tab is visible, and immediately
 * when the tab regains focus/visibility — so open dashboards and storefront
 * pages pick up changes made elsewhere (a sale, a refund, an admin edit)
 * without a manual reload.
 */
export function useLiveRefresh(refresh: () => void | Promise<void>, intervalMs = 20000): void {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    const tick = () => void refreshRef.current()

    const id = setInterval(() => {
      if (document.visibilityState === "visible") tick()
    }, intervalMs)

    const onFocus = () => tick()
    const onVisible = () => {
      if (document.visibilityState === "visible") tick()
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(id)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [intervalMs])
}
