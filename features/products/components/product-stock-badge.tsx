"use client"

// Client island rendered inside the (server-rendered) product card. Reads live
// catalog state so stock/status changes made in the admin surface immediately
// as badges, without making the whole listing a client component.

import type { Product } from "@/lib/types"
import { useProduct } from "@/features/catalog"
import { stockLabel, stockLevel } from "@/features/products/lib/product"
import { cn } from "@/lib/utils"

export function ProductStockBadge({ product: seed }: { product: Product }) {
  const product = useProduct(seed.slug, seed) ?? seed
  const level = stockLevel(product)

  // "in-stock" needs no badge — an unremarkable, purchasable product stays clean.
  if (level === "in-stock") return null

  const tone =
    level === "out-of-stock"
      ? "bg-destructive/90 text-destructive-foreground"
      : level === "low-stock"
        ? "bg-amber-500/90 text-black"
        : "bg-foreground/10 text-foreground backdrop-blur-md"

  return (
    <span
      className={cn(
        "absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em]",
        tone,
      )}
    >
      {stockLabel(product)}
    </span>
  )
}
