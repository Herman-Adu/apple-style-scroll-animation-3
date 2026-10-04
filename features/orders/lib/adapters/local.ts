// Infrastructure adapter: browser-only reference backend for orders.
// Persists orders in localStorage so the full purchase → history → invoice flow
// works in preview with zero backend. Implements the same OrdersAdapter port a
// real Stripe/server adapter would, so the application layer cannot tell them apart.

import type { Carrier } from "../domain/tracking"
import type { CreateOrderInput, Order, OrderStatus, OrdersAdapter } from "../domain/types"

const ORDERS_KEY = "momo.orders"

function readAll(): Order[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(ORDERS_KEY) || "[]")
  } catch {
    return []
  }
}

function writeAll(orders: Order[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

/** Simulated latency so loading states behave like a real network. */
const tick = () => new Promise((r) => setTimeout(r, 350))

function nextNumber(existing: Order[]): string {
  const year = new Date().getFullYear()
  const seq = existing.length + 1
  return `MOMO-${year}-${String(seq).padStart(4, "0")}`
}

export function createLocalOrdersAdapter(): OrdersAdapter {
  return {
    async list(userId: string): Promise<Order[]> {
      await tick()
      return readAll()
        .filter((order) => order.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    },

    async listAll(): Promise<Order[]> {
      await tick()
      return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    },

    async create(input: CreateOrderInput): Promise<Order> {
      await tick()
      const all = readAll()
      const order: Order = {
        id: crypto.randomUUID(),
        number: nextNumber(all),
        createdAt: new Date().toISOString(),
        status: "processing",
        ...input,
      }
      all.push(order)
      writeAll(all)
      return order
    },

    async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
      await tick()
      const all = readAll()
      const index = all.findIndex((order) => order.id === orderId)
      if (index === -1) throw new Error("Order not found")
      all[index] = { ...all[index], status }
      writeAll(all)
      return all[index]
    },

    // No real payment provider behind this adapter, so there is nothing to
    // issue a Stripe refund against. Simulated locally: mark the requested
    // amount refunded so the demo UI still behaves, without pretending money
    // actually moved.
    async refund(orderId: string, amount?: number, reason?: string): Promise<Order> {
      await tick()
      const all = readAll()
      const index = all.findIndex((order) => order.id === orderId)
      if (index === -1) throw new Error("Order not found")
      const order = all[index]
      const refundedSoFar = order.refundedAmount ?? 0
      const requested = amount ?? order.total - refundedSoFar
      const nextRefundedAmount = Math.min(order.total, refundedSoFar + requested)
      const isFullRefund = nextRefundedAmount >= order.total - 0.001
      all[index] = {
        ...order,
        refundedAmount: nextRefundedAmount,
        refunds: [
          ...(order.refunds ?? []),
          {
            id: crypto.randomUUID(),
            amount: requested,
            currency: order.currency,
            reason,
            createdAt: new Date().toISOString(),
          },
        ],
        status: isFullRefund ? "refunded" : order.status,
      }
      writeAll(all)
      return all[index]
    },

    // No email backend behind this adapter — just persist the tracking info
    // and stamp shippedAt on first save, mirroring the Neon adapter's shape
    // without pretending an email was sent.
    async addTracking(
      orderId: string,
      input: { carrier: Carrier; trackingNumber: string; trackingUrl?: string },
    ): Promise<Order> {
      await tick()
      const all = readAll()
      const index = all.findIndex((order) => order.id === orderId)
      if (index === -1) throw new Error("Order not found")
      const order = all[index]
      all[index] = {
        ...order,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl: input.trackingUrl,
        shippedAt: order.shippedAt ?? new Date().toISOString(),
      }
      writeAll(all)
      return all[index]
    },
  }
}
