import type { Product } from "@/features/products"
import { stockLabel, stockLevel } from "@/features/products"
import type { OrderStatus } from "@/features/orders"
import { cn } from "@/lib/utils"

const STOCK_TONE: Record<ReturnType<typeof stockLevel>, string> = {
  "in-stock": "border-success/30 bg-success/10 text-success",
  "low-stock": "border-warning/30 bg-warning/10 text-warning",
  "out-of-stock": "border-destructive/30 bg-destructive/10 text-destructive-strong",
  preorder: "border-info/30 bg-info/10 text-info",
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
  processing: "border-warning/30 bg-warning/10 text-warning",
  fulfilled: "border-success/30 bg-success/10 text-success",
  cancelled: "border-border bg-foreground/5 text-muted-foreground",
  refunded: "border-destructive/30 bg-destructive/10 text-destructive-strong",
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
