"use client"

import { useEffect } from "react"

import { useCart } from "@/lib/cart-context"

/** Empties the cart once, after a confirmed order lands on the return page.
 * Rendered by the (server) confirmation page; `clear` is a stable callback so
 * this runs a single time on mount. */
export function ClearCart() {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
