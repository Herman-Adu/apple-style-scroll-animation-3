"use client"

import { motion } from "framer-motion"
import { useCart } from "@/lib/cart-context"
import { useProduct } from "@/features/catalog"
import type { Product } from "@/lib/types"
import { isPurchasable, stockLevel } from "@/features/products"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
  product: Product
  color: string
  quantity?: number
  variant?: "solid" | "outline"
  showPrice?: boolean
  className?: string
}

export function AddToCartButton({
  product: seed,
  color,
  quantity = 1,
  variant = "solid",
  showPrice = true,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  // Read live product state so stock/status changes from the admin are enforced here.
  const product = useProduct(seed.slug, seed) ?? seed

  const level = stockLevel(product)
  const purchasable = isPurchasable(product)

  const label =
    level === "coming-soon"
      ? "Coming soon"
      : level === "out-of-stock"
        ? "Sold out"
        : product.releaseStatus === "preorder"
          ? "Pre-order"
          : "Add to cart"

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (!purchasable) return
        addItem(product, color, quantity)
      }}
      disabled={!purchasable}
      aria-disabled={!purchasable}
      whileHover={purchasable ? { scale: 1.02 } : undefined}
      whileTap={purchasable ? { scale: 0.98 } : undefined}
      className={cn(
        "pointer-events-auto inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-colors",
        variant === "solid"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-foreground/25 text-foreground hover:bg-foreground hover:text-background",
        !purchasable && "cursor-not-allowed opacity-40 hover:bg-foreground hover:text-background",
        className,
      )}
    >
      <span>{label}</span>
      {showPrice && purchasable && (
        <>
          <span className="h-4 w-px bg-current opacity-30" />
          <span>{formatMoney(product.price)}</span>
        </>
      )}
    </motion.button>
  )
}
