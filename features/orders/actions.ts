// Orders slice, server-action entry. The adapter calls server actions (refunds reach
// Stripe), so it is kept out of the client-safe `@/features/orders` index.
export { ordersAdapter } from "./orders-adapter"
export type { OrdersAdapter } from "./types"
