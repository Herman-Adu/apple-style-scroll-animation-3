"use client"

import { motion } from "framer-motion"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AddToCartButtonProps {
  product: Product
  color: string
  variant?: "solid" | "outline"
  showPrice?: boolean
  className?: string
}

export function AddToCartButton({
  product,
  color,
  variant = "solid",
  showPrice = true,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart()

  const label = product.releaseStatus === "preorder" ? "Pre-order" : "Add to cart"

  return (
    <motion.button
      type="button"
      onClick={() => addItem(product, color)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "pointer-events-auto inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-semibold tracking-wide transition-colors",
        variant === "solid"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "border border-foreground/25 text-foreground hover:bg-foreground hover:text-background",
        className,
      )}
    >
      <span>{label}</span>
      {showPrice && (
        <>
          <span className="h-4 w-px bg-current opacity-30" />
          <span>{formatMoney(product.price)}</span>
        </>
      )}
    </motion.button>
  )
}
