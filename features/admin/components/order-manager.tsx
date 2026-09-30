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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/features/orders"
import { formatMoney } from "@/lib/format"
import { OrderStatusBadge } from "./status-badges"
import { useAdminOrders } from "../hooks/use-admin-orders"
import { ColumnsMenu, type ColumnOption } from "./columns-menu"

const ORDER_COLUMNS: ColumnOption[] = [
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
]

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All orders" },
  { value: "processing", label: "Processing" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
]

/**
 * Statuses settable via the plain "Set status" dropdown. Cancelled and
 * refunded are deliberately excluded — those move money and must go through
 * the RefundPanel's Stripe-backed actions (refundOrderAction), never a raw
 * status write. STATUS_FILTERS still lists them for viewing/filtering.
 */
const STATUS_OPTIONS: OrderStatus[] = ["processing", "fulfilled"]

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso))
}

/**
 * Cancel-and-refund + partial-refund controls for a single order, plus its
 * refund audit trail. Every refund is issued through Stripe (refundOrderAction
 * via useAdminOrders) — this component never touches money math beyond
 * clamping the input to what's actually left to refund.
 */
function RefundPanel({
  order,
  onRefund,
}: {
  order: Order
  onRefund: (amount: number | undefined, reason: string | undefined) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const refunded = order.refundedAmount ?? 0
  const remaining = Math.max(0, Math.round((order.total - refunded) * 100) / 100)
  const isFullyRefunded = remaining <= 0
  const history = order.refunds ?? []

  async function submitPartial() {
    const value = Number(amountInput)
    if (!Number.isFinite(value) || value <= 0 || value > remaining) {
      toast.error(`Enter an amount between 0.01 and ${remaining}.`)
      return
    }
    setSubmitting(true)
    try {
      await onRefund(value, reason.trim() || undefined)
      toast.success(`Refunded ${formatMoney({ amount: value, currency: order.currency })}`)
      setOpen(false)
      setAmountInput("")
      setReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed.")
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelAndRefund() {
    setSubmitting(true)
    try {
      await onRefund(undefined, "Order cancelled")
      toast.success(`${order.number} cancelled and fully refunded`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refund failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Refunds</p>
        {refunded > 0 ? (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatMoney({ amount: refunded, currency: order.currency })} refunded
          </span>
        ) : null}
      </div>

      {history.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {history.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatDateTime(entry.createdAt)}</span>
              <span className="font-mono tabular-nums">
                {formatMoney({ amount: entry.amount, currency: entry.currency })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {isFullyRefunded ? (
        <p className="text-xs text-muted-foreground">This order has been fully refunded.</p>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={submitting}
            onClick={cancelAndRefund}
            className="flex-1"
          >
            Cancel &amp; refund
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={submitting} className="flex-1">
                Partial refund
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Partial refund — {order.number}</DialogTitle>
                <DialogDescription>
                  Up to {formatMoney({ amount: remaining, currency: order.currency })} remaining to refund.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="refund-amount">Amount ({order.currency.toUpperCase()})</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min={0.01}
                    max={remaining}
                    step={0.01}
                    inputMode="decimal"
                    placeholder={remaining.toFixed(2)}
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="refund-reason">Reason (optional)</Label>
                  <Input
                    id="refund-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Damaged item"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={submitPartial} disabled={submitting}>
                  Refund {amountInput ? formatMoney({ amount: Number(amountInput) || 0, currency: order.currency }) : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

export function OrderManager() {
  const { orders, loading, updateStatus, refund } = useAdminOrders()
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => new Set(["customer", "date"]))

  function toggleCol(key: string) {
    setHiddenCols((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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
      <div className="flex items-center gap-2">
        <div className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value ? "bg-accent-teal text-background" : "text-muted-foreground hover:bg-accent-teal/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ColumnsMenu columns={ORDER_COLUMNS} hidden={hiddenCols} onToggle={toggleCol} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="scrollbar-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order</th>
                {!hiddenCols.has("customer") ? <th className="px-4 py-3 font-medium">Customer</th> : null}
                {!hiddenCols.has("date") ? <th className="px-4 py-3 font-medium">Date</th> : null}
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
                      className="cursor-pointer transition-colors hover:bg-accent-teal/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs font-medium">{order.number}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{units} items</p>
                      </td>
                      {!hiddenCols.has("customer") ? (
                        <td className="px-4 py-3">
                          <p className="max-w-[16ch] truncate text-muted-foreground">{order.email}</p>
                        </td>
                      ) : null}
                      {!hiddenCols.has("date") ? (
                        <td className="px-4 py-3 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                      ) : null}
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

                {/* Full refunds always resolve to "refunded" (see refund-actions.ts),
                    so the panel — and its permanent audit trail of every refund
                    entry — stays visible regardless of status. */}
                <RefundPanel order={active} onRefund={(amount, reason) => refund(active.id, amount, reason)} />
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
