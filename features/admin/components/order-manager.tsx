"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/features/orders"
import { formatMoney } from "@/lib/format"
import { OrderStatusBadge } from "./status-badges"
import { useAdminOrders } from "../hooks/use-admin-orders"

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "processing", label: "Processing" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

const STATUS_OPTIONS: OrderStatus[] = ["processing", "fulfilled", "cancelled", "refunded"]

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function OrderManager() {
  const { orders, loading, updateStatus } = useAdminOrders()
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [activeId, setActiveId] = useState<string | null>(null)

  const visible = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const active = useMemo(() => orders.find((o) => o.id === activeId) ?? null, [orders, activeId])

  async function onStatusChange(order: Order, status: OrderStatus) {
    await updateStatus(order.id, status)
    toast.success(`${order.number} → ${status}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Set status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Loading orders…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No orders in this view.
                  </td>
                </tr>
              ) : (
                visible.map((order) => {
                  const units = order.items.reduce((n, i) => n + i.quantity, 0)
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setActiveId(order.id)}
                      className="cursor-pointer transition-colors hover:bg-foreground/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium">{order.number}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{units} items</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[16ch] truncate text-muted-foreground">{order.email}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        {formatMoney({ amount: order.total, currency: order.currency })}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <Select value={order.status} onValueChange={(v) => onStatusChange(order, v as OrderStatus)}>
                            <SelectTrigger className="h-8 w-36" aria-label={`Set status for ${order.number}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {active ? (
            <>
              <SheetHeader className="border-b border-border px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <SheetTitle className="font-mono">{active.number}</SheetTitle>
                  <OrderStatusBadge status={active.status} />
                </div>
                <SheetDescription>
                  {active.email} · {formatDateTime(active.createdAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Items</p>
                  {active.items.map((item, i) => (
                    <div key={`${item.slug}-${i}`} className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <span className="font-medium">
                          {item.quantity} × {item.name}
                        </span>
                        {item.color ? <span className="text-muted-foreground"> · {item.color}</span> : null}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                        {formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium">Total</span>
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {formatMoney({ amount: active.total, currency: active.currency })}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Order status
                  </label>
                  <Select value={active.status} onValueChange={(v) => onStatusChange(active, v as OrderStatus)}>
                    <SelectTrigger aria-label={`Set status for ${active.number}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
