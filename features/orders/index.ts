// Orders feature slice — canonical import surface for the orders domain.
//
// The infrastructure (adapter port + localStorage adapter) still physically
// lives under `lib/orders` alongside the other adapter-backed ports (auth),
// but the domain is consumed through this slice so it matches the
// feature-sliced convention used by products/articles/docs. Import from
// `@/features/orders` everywhere; the `lib/orders` location is an
// implementation detail that a Strapi/Stripe adapter can replace.

export { ordersAdapter } from "@/lib/orders"
export type { Order, OrderItem, OrderStatus, CreateOrderInput, OrdersAdapter } from "@/lib/orders/types"

export * from "./lib/analytics"
