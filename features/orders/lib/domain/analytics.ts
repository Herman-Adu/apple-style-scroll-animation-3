// Pure analytics selectors derived from orders (+ catalog for stock KPIs).
//
// Deliberately source-agnostic: give them an array of Orders and Products and
// they compute KPIs with no I/O. Works identically on the local adapter today
// and a Strapi/Stripe-backed order list later. Keep all aggregation here so the
// admin UI stays dumb and the math is testable in isolation.

import type { Order } from "./types"
import type { Product } from "@/features/products"
import { effectiveStock, isLowStock, stockLevel } from "@/features/products"

/** Orders that represent realized activity (exclude cancelled; fully-refunded orders net to $0 automatically). */
function revenueOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded")
}

/**
 * What the order is actually worth today, in the order's major currency unit.
 * Every order was captured for its full `total` at checkout; partial or full
 * refunds reduce that down toward (but never below) zero. This is the figure
 * that should drive revenue reporting and tax reconciliation, since it always
 * matches what Stripe actually settled and kept.
 */
function netAmount(order: Order): number {
  return Math.max(0, order.total - (order.refundedAmount ?? 0))
}

export interface SalesSummary {
  /** Full value of every order at checkout, before any refunds. */
  grossRevenue: number
  /** Total refunded across all orders (full + partial), to date. */
  refunds: number
  /** grossRevenue - refunds. The figure that matches Stripe's net settlement. */
  revenue: number
  orderCount: number
  unitsSold: number
  averageOrderValue: number
  currency: string
}

export function salesSummary(orders: Order[]): SalesSummary {
  const realized = revenueOrders(orders)
  const grossRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const refunds = orders.reduce((sum, o) => sum + (o.refundedAmount ?? 0), 0)
  const revenue = grossRevenue - refunds
  const unitsSold = realized.reduce((sum, o) => sum + o.items.reduce((n, i) => n + i.quantity, 0), 0)
  const orderCount = realized.length
  const realizedNet = realized.reduce((sum, o) => sum + netAmount(o), 0)
  return {
    grossRevenue,
    refunds,
    revenue,
    orderCount,
    unitsSold,
    averageOrderValue: orderCount > 0 ? realizedNet / orderCount : 0,
    currency: orders[0]?.currency ?? "USD",
  }
}

export interface RevenuePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string
  revenue: number
  orders: number
}

/**
 * Daily net-revenue series for the trailing `days` window, oldest → newest.
 * Each order's contribution is its current net amount (total minus refunds
 * to date), attributed to its checkout day — so a refund immediately pulls
 * that day's bar down to reflect what was actually kept, matching Stripe.
 * `orders` counts active (non-cancelled/non-fully-refunded) orders that day.
 */
export function revenueByDay(orders: Order[], days = 30): RevenuePoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    buckets.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 })
  }

  for (const order of orders) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.revenue += netAmount(order)
    if (order.status !== "cancelled" && order.status !== "refunded") bucket.orders += 1
  }

  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }))
}

export interface ProductSales {
  slug: string
  name: string
  unitsSold: number
  revenue: number
}

/** Best sellers by units, descending. */
export function topProducts(orders: Order[], limit = 5): ProductSales[] {
  const map = new Map<string, ProductSales>()
  for (const order of revenueOrders(orders)) {
    for (const item of order.items) {
      const entry = map.get(item.slug) ?? { slug: item.slug, name: item.name, unitsSold: 0, revenue: 0 }
      entry.unitsSold += item.quantity
      entry.revenue += item.unitAmount * item.quantity
      map.set(item.slug, entry)
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit)
}

export interface InventorySummary {
  totalProducts: number
  totalUnits: number
  lowStockCount: number
  outOfStockCount: number
  lowStock: Product[]
}

export function inventorySummary(products: Product[]): InventorySummary {
  const lowStock = products.filter(isLowStock)
  const outOfStock = products.filter((p) => stockLevel(p) === "out-of-stock")
  return {
    totalProducts: products.length,
    totalUnits: products.reduce((sum, p) => sum + effectiveStock(p), 0),
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStock,
  }
}

export interface StatusBreakdown {
  status: Order["status"]
  count: number
}

export function ordersByStatus(orders: Order[]): StatusBreakdown[] {
  const order: Order["status"][] = ["processing", "fulfilled", "cancelled", "refunded"]
  const counts = new Map<Order["status"], number>()
  for (const o of orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1)
  return order.map((status) => ({ status, count: counts.get(status) ?? 0 }))
}
