"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import type { Product } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { useProduct } from "@/features/catalog"
import { isPurchasable, purchasableQuantity, stockLabel, stockLevel } from "@/features/products"
import { AddToCartButton } from "./add-to-cart-button"
import { cn } from "@/lib/utils"

const stockTone: Record<ReturnType<typeof stockLevel>, string> = {
  "in-stock": "text-foreground/50",
  "low-stock": "text-amber-500",
  "out-of-stock": "text-destructive",
  preorder: "text-foreground/50",
  "coming-soon": "text-foreground/50",
}

export function ProductPurchase({ product: seed }: { product: Product }) {
  const product = useProduct(seed.slug, seed) ?? seed
  const [color, setColor] = useState(product.colors[0])
  const [quantity, setQuantity] = useState(1)

  const purchasable = isPurchasable(product)
  const level = stockLevel(product)
  const isPreorder = product.releaseStatus === "preorder"
  // Pre-orders have no physical cap; physical products cap at available stock.
  const maxQuantity = isPreorder ? 99 : Math.min(99, purchasableQuantity(product))
  const canIncrement = quantity < maxQuantity
  const canDecrement = quantity > 1

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">{product.category}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl">{product.name}</h1>
        <p className="mt-3 text-lg text-foreground/60">{product.tagline}</p>
      </div>

      <p className="text-base leading-relaxed text-foreground/70">{product.description}</p>

      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-foreground/40">
          Finish — <span className="text-foreground/70">{color}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-pressed={option === color}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                option === color
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/20 text-foreground/70 hover:border-foreground/50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Live stock indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className={cn(
            "h-2 w-2 rounded-full",
            level === "out-of-stock"
              ? "bg-destructive"
              : level === "low-stock"
                ? "bg-amber-500"
                : "bg-emerald-500",
          )}
        />
        <span className={stockTone[level]}>{stockLabel(product)}</span>
      </div>

      <div className="flex flex-wrap items-center gap-6 border-t border-foreground/10 pt-8">
        <span className="text-3xl font-semibold text-foreground">{formatMoney(product.price)}</span>

        {purchasable && !isPreorder && (
          <div className="inline-flex items-center rounded-full border border-foreground/20">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={!canDecrement}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Minus className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span className="min-w-8 text-center text-sm font-medium tabular-nums text-foreground">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={!canIncrement}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 transition-colors hover:text-foreground disabled:opacity-30"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <AddToCartButton product={product} color={color} quantity={quantity} showPrice={false} />
      </div>
    </div>
  )
}
