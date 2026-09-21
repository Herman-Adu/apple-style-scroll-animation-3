"use client"

import { useState } from "react"
import type { Product } from "@/lib/types"
import { formatMoney } from "@/lib/format"
import { AddToCartButton } from "./add-to-cart-button"
import { cn } from "@/lib/utils"

export function ProductPurchase({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0])

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

      <div className="flex items-center gap-6 border-t border-foreground/10 pt-8">
        <span className="text-3xl font-semibold text-foreground">{formatMoney(product.price)}</span>
        <AddToCartButton product={product} color={color} showPrice={false} />
      </div>
    </div>
  )
}
