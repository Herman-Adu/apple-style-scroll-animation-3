// Pure selectors for the admin Customers area.
//
// Source-agnostic and I/O-free: give them users + orders and they compute the
// derived customer records, segments, and KPIs. Same math on the local adapter
// today and a Strapi/Stripe-backed list later. No card/payment data anywhere.

import type { Order } from "@/lib/orders/types"
import type { OfferTag, User, UserRole } from "@/lib/auth/types"
import { isOfferActive } from "@/features/checkout/lib/pricing"
import type {
  CustomerKpis,
  CustomerRecord,
  CustomerSegment,
  CustomerSort,
  PurchasedProduct,
} from "./types"

/** Orders that represent realized revenue (exclude cancelled/refunded). */
function isPaid(order: Order): boolean {
  return order.status !== "cancelled" && order.status !== "refunded"
}

/** Role after applying any explicit admin override. */
export function effectiveRole(user: User): UserRole {
  return user.roleOverride ?? user.role
}

function newestFirst(a: Order, b: Order): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

function joinedLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(iso))
}

/**
 * Left-join orders onto users. Orders match by `userId`, falling back to a
 * case-insensitive email match so guest-style orders still attribute correctly.
 */
export function buildCustomerRecords(users: User[], orders: Order[]): CustomerRecord[] {
  const fallbackCurrency = orders[0]?.currency ?? "USD"

  return users.map((user) => {
    const emailKey = user.email.trim().toLowerCase()
    const mine = orders.filter(
      (o) => o.userId === user.id || o.email.trim().toLowerCase() === emailKey,
    )
    const allOrders = [...mine].sort(newestFirst)
    const paidOrders = allOrders.filter(isPaid)

    const lifetimeSpend = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const orderCount = paidOrders.length
    const unitCount = paidOrders.reduce(
      (n, o) => n + o.items.reduce((sum, i) => sum + i.quantity, 0),
      0,
    )
    const avgOrderValue = orderCount > 0 ? lifetimeSpend / orderCount : 0

    // De-dupe purchased products across paid orders, summing quantity + revenue.
    const productMap = new Map<string, PurchasedProduct>()
    for (const order of paidOrders) {
      for (const item of order.items) {
        const entry =
          productMap.get(item.slug) ??
          { slug: item.slug, name: item.name, image: item.image, quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.unitAmount * item.quantity
        productMap.set(item.slug, entry)
      }
    }

    // Orders are newest first, so the last element is the earliest order.
    const currency = paidOrders[0]?.currency ?? allOrders[0]?.currency ?? fallbackCurrency

    return {
      user,
      effectiveRole: effectiveRole(user),
      joinedLabel: joinedLabel(user.createdAt),
      stats: {
        orderCount,
        unitCount,
        lifetimeSpend,
        avgOrderValue,
        currency,
        firstOrderAt: allOrders[allOrders.length - 1]?.createdAt,
        lastOrderAt: allOrders[0]?.createdAt,
        products: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity),
        orders: allOrders,
      },
    }
  })
}

/** Segment definitions — drives both the sub-nav and the in-page filter tabs. */
export const SEGMENTS: { value: CustomerSegment; label: string }[] = [
  { value: "all", label: "All" },
  { value: "customers", label: "Customers" },
  { value: "subscribers", label: "Subscribers" },
  { value: "admins", label: "Admins" },
  { value: "blocked", label: "Blocked" },
]

/** Filter records by segment. */
export function filterBySegment(records: CustomerRecord[], segment: CustomerSegment): CustomerRecord[] {
  switch (segment) {
    case "customers":
      return records.filter((r) => r.effectiveRole === "customer")
    case "subscribers":
      return records.filter((r) => r.user.profile.newsletter)
    case "admins":
      return records.filter((r) => r.effectiveRole === "admin")
    case "blocked":
      return records.filter((r) => (r.user.status ?? "active") === "blocked")
    default:
      return records
  }
}

/** Case-insensitive name/email search. */
export function searchCustomers(records: CustomerRecord[], query: string): CustomerRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return records
  return records.filter(
    (r) =>
      r.user.name.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      (r.user.profile.displayName?.toLowerCase().includes(q) ?? false),
  )
}

/** Sort records by the selected key (returns a new array). */
export function sortCustomers(records: CustomerRecord[], sort: CustomerSort): CustomerRecord[] {
  const copy = [...records]
  switch (sort) {
    case "top-spend":
      return copy.sort((a, b) => b.stats.lifetimeSpend - a.stats.lifetimeSpend)
    case "most-orders":
      return copy.sort((a, b) => b.stats.orderCount - a.stats.orderCount)
    case "name":
      return copy.sort((a, b) => a.user.name.localeCompare(b.user.name))
    case "recent":
    default:
      // Most recent activity first: last order, falling back to account creation.
      return copy.sort((a, b) => {
        const at = new Date(a.stats.lastOrderAt ?? a.user.createdAt).getTime()
        const bt = new Date(b.stats.lastOrderAt ?? b.user.createdAt).getTime()
        return bt - at
      })
  }
}

/** Top-of-page totals across all records. */
export function customerKpis(records: CustomerRecord[]): CustomerKpis {
  const lifetimeRevenue = records.reduce((sum, r) => sum + r.stats.lifetimeSpend, 0)
  const paying = records.filter((r) => r.stats.orderCount > 0).length
  return {
    total: records.length,
    active: records.filter((r) => (r.user.status ?? "active") === "active").length,
    paying,
    subscribers: records.filter((r) => r.user.profile.newsletter).length,
    lifetimeRevenue,
    avgPerCustomer: paying > 0 ? lifetimeRevenue / paying : 0,
    currency: records.find((r) => r.stats.currency)?.stats.currency ?? "USD",
  }
}

/** Aggregate performance of personal offers across all customers. */
export interface OfferAnalytics {
  /** Offers granted (all kinds, active + expired). */
  total: number
  /** Offers still valid at evaluation time. */
  active: number
  /** Offers past their expiry. */
  expired: number
  /** Offers a branded email was sent for (`notifiedAt` set). */
  sent: number
  /** Offers used at checkout at least once. */
  redeemed: number
  /** Total number of times offers were used (sum of redemption counts). */
  redemptions: number
  /** redeemed / sent, in 0..1. Zero when nothing has been emailed. */
  conversionRate: number
  /** Customers who currently hold at least one offer. */
  customersWithOffers: number
  /** Breakdown of offers by kind. */
  byKind: { percent: number; shipping: number; custom: number }
}

/**
 * Roll up every customer's offers into headline numbers for the admin Analytics
 * page. Pure and I/O-free — expiry is judged with the same `isOfferActive` guard
 * the checkout uses, so "active" here always matches what actually discounts.
 */
export function offerAnalytics(users: User[], now: number = Date.now()): OfferAnalytics {
  let total = 0
  let active = 0
  let expired = 0
  let sent = 0
  let redeemed = 0
  let redemptions = 0
  let customersWithOffers = 0
  const byKind = { percent: 0, shipping: 0, custom: 0 }

  for (const user of users) {
    const offers: OfferTag[] = user.offers ?? []
    if (offers.length > 0) customersWithOffers += 1
    for (const offer of offers) {
      total += 1
      if (isOfferActive(offer, now)) active += 1
      else expired += 1
      if (offer.notifiedAt) sent += 1
      const count = offer.redemptionCount ?? 0
      if (count > 0) redeemed += 1
      redemptions += count
      byKind[offer.kind] += 1
    }
  }

  return {
    total,
    active,
    expired,
    sent,
    redeemed,
    redemptions,
    conversionRate: sent > 0 ? redeemed / sent : 0,
    customersWithOffers,
    byKind,
  }
}

/** Count of records in each segment — used for sub-nav / tab badges. */
export function segmentCounts(records: CustomerRecord[]): Record<CustomerSegment, number> {
  return {
    all: records.length,
    customers: filterBySegment(records, "customers").length,
    subscribers: filterBySegment(records, "subscribers").length,
    admins: filterBySegment(records, "admins").length,
    blocked: filterBySegment(records, "blocked").length,
  }
}
