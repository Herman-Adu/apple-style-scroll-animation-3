import type { Product } from "@/features/products"
import { stockLabel, stockLevel } from "@/features/products"
import type { OrderStatus } from "@/features/orders"
import { cn } from "@/lib/utils"

const STOCK_TONE: Record<ReturnType<typeof stockLevel>, string> = {
  "in-stock": "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  "low-stock": "border-amber-500/30 bg-amber-500/10 text-amber-500",
  "out-of-stock": "border-red-500/30 bg-red-500/10 text-red-500",
  preorder: "border-sky-500/30 bg-sky-500/10 text-sky-500",
  "coming-soon": "border-border bg-foreground/5 text-muted-foreground",
}

export function StockBadge({ product }: { product: Product }) {
  const level = stockLevel(product)
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        STOCK_TONE[level],
      )}
    >
      {stockLabel(product)}
    </span>
  )
}

const ORDER_TONE: Record<OrderStatus, string> = {
  processing: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  fulfilled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  cancelled: "border-border bg-foreground/5 text-muted-foreground",
  refunded: "border-red-500/30 bg-red-500/10 text-red-500",
}

const ORDER_LABEL: Record<OrderStatus, string> = {
  processing: "Processing",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        ORDER_TONE[status],
      )}
    >
      {ORDER_LABEL[status]}
    </span>
  )
}
