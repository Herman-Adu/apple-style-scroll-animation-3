"use client"

import { useEffect } from "react"

import { useCart } from "@/lib/cart-context"

/** Empties the cart after a confirmed order lands on the return page.
 * Gated on `hydrated` so the provider's rehydrate-from-localStorage effect
 * (which runs after this child effect on mount) can't re-populate the cart
 * after we clear it. Once hydration completes we clear, and the persist effect
 * writes the empty cart back to storage. */
export function ClearCart() {
  const { clear, hydrated } = useCart()
  useEffect(() => {
    if (hydrated) clear()
  }, [hydrated, clear])
  return null
}
