"use client"

import Link from "next/link"
import { Package } from "lucide-react"
import { useOrders } from "@/hooks/use-orders"
import { Spinner } from "@/components/ui/spinner"
import { OrderCard } from "@/components/account/order-card"

export function OrderHistory({
  userId,
  billTo,
}: {
  userId: string
  billTo: { name: string; email: string }
}) {
  const { orders, loading } = useOrders(userId)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-5 text-foreground/40" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/10 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
          <Package className="h-6 w-6 text-foreground/40" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-base font-medium text-foreground">No orders yet</h3>
        <p className="mt-1 max-w-xs text-sm text-foreground/45">
          When you place an order it will appear here with its invoice.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} billTo={billTo} />
      ))}
    </div>
  )
}
