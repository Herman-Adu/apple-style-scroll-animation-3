"use client"

import Image from "next/image"
import { FileText } from "lucide-react"
import { formatMoney } from "@/lib/format"
import { printInvoice } from "@/lib/orders/invoice"
import type { Order, OrderStatus } from "@/lib/orders/types"

const STATUS_LABEL: Record<OrderStatus, string> = {
  processing: "Processing",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

// Small status dot color. Kept to a tight, functional set so it reads as a state
// indicator rather than decoration.
const STATUS_DOT: Record<OrderStatus, string> = {
  processing: "bg-amber-400",
  fulfilled: "bg-emerald-400",
  cancelled: "bg-foreground/30",
  refunded: "bg-foreground/30",
}

export function OrderCard({ order, billTo }: { order: Order; billTo: { name: string; email: string } }) {
  const date = new Date(order.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm font-medium text-foreground">{order.number}</p>
          <p className="mt-1 text-xs text-foreground/45">
            {date} · {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[order.status]}`} aria-hidden />
          <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/55">
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>

      <ul className="mt-5 flex flex-col divide-y divide-foreground/5 border-t border-foreground/5">
        {order.items.map((item) => (
          <li key={`${item.slug}-${item.color}`} className="flex items-center gap-4 py-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">{item.name}</p>
              <p className="text-xs text-foreground/40">
                {item.color ? `${item.color} · ` : ""}Qty {item.quantity}
              </p>
            </div>
            <span className="text-sm text-foreground/70">
              {formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 pt-4">
        <div className="text-sm">
          <span className="text-foreground/45">Total</span>{" "}
          <span className="font-semibold text-foreground">
            {formatMoney({ amount: order.total, currency: order.currency })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => printInvoice(order, billTo)}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80 transition-colors hover:bg-foreground/5"
        >
          <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
          Invoice
        </button>
      </div>
    </div>
  )
}
