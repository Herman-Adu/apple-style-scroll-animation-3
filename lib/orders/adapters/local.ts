// Infrastructure adapter: browser-only reference backend for orders.
// Persists orders in localStorage so the full purchase → history → invoice flow
// works in preview with zero backend. Implements the same OrdersAdapter port a
// real Stripe/server adapter would, so the application layer cannot tell them apart.

import type { CreateOrderInput, Order, OrdersAdapter } from "../types"

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
  }
}
