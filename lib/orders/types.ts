// Domain model for orders + invoices.
//
// This mirrors the auth layer: the application talks to an `OrdersAdapter` port,
// and infrastructure (localStorage today, Stripe/your backend tomorrow) implements
// it. Swapping to a real payment provider means writing one adapter — the UI,
// hook, and types below do not change.

export type OrderStatus = "processing" | "fulfilled" | "cancelled" | "refunded"

export interface OrderItem {
  slug: string
  name: string
  image?: string
  color?: string
  quantity: number
  /** Unit price in the currency's major units (matches Product.price.amount). */
  unitAmount: number
  currency: string
}

export interface Order {
  id: string
  /** Human-friendly reference, e.g. MOMO-2026-0001. Doubles as the invoice number. */
  number: string
  userId: string
  email: string
  createdAt: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  currency: string
}

/** Everything needed to record an order. The adapter assigns id/number/date/status. */
export interface CreateOrderInput {
  userId: string
  email: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  currency: string
}

/** Infrastructure port. A Stripe adapter would implement this same contract. */
export interface OrdersAdapter {
  list(userId: string): Promise<Order[]>
  create(input: CreateOrderInput): Promise<Order>
}
