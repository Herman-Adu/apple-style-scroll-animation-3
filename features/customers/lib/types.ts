// Domain model for the admin Customers area.
//
// A CustomerRecord is a *derived* view: a User left-joined with their orders and
// the aggregates computed from them. It holds no card/payment data — Stripe and
// Clerk own that. These types are pure data; all computation lives in analytics.ts.

import type { Order } from "@/lib/orders/types"
import type { User, UserRole } from "@/lib/auth/types"

/** A product a customer has bought, with totals across all their paid orders. */
export interface PurchasedProduct {
  slug: string
  name: string
  image?: string
  quantity: number
  /** Revenue this customer generated for the product (unit amount × quantity). */
  revenue: number
}

/** Aggregates derived from a customer's orders. Realized (paid) orders drive money math. */
export interface CustomerStats {
  orderCount: number
  unitCount: number
  lifetimeSpend: number
  avgOrderValue: number
  currency: string
  firstOrderAt?: string
  lastOrderAt?: string
  /** Distinct products purchased, highest quantity first. */
  products: PurchasedProduct[]
  /** Every order for this customer, newest first (for history display). */
  orders: Order[]
}

/** A user plus the aggregates derived from their orders. */
export interface CustomerRecord {
  user: User
  /** Role after applying any explicit override — what the UI should display. */
  effectiveRole: UserRole
  /** Preformatted account-created label, e.g. "Sep 2026". */
  joinedLabel: string
  stats: CustomerStats
}

/** Segments the admin can filter by — mirrors the Customers sub-nav. */
export type CustomerSegment = "all" | "customers" | "subscribers" | "blocked" | "admins"

/** Top-of-page totals across all records. */
export interface CustomerKpis {
  total: number
  active: number
  /** Customers with at least one paid order. */
  paying: number
  subscribers: number
  lifetimeRevenue: number
  avgPerCustomer: number
  currency: string
}

/** Sort options for the customer list. */
export type CustomerSort = "recent" | "top-spend" | "most-orders" | "name"
