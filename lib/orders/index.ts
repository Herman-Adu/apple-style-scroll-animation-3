// Single seam where the orders backend is selected. Today it's the local
// (localStorage) adapter. To go live with Stripe or your own API, implement the
// OrdersAdapter port in a new adapter and swap the line below — nothing else changes.

import { createLocalOrdersAdapter } from "./adapters/local"

export const ordersAdapter = createLocalOrdersAdapter()

export type { Order, OrderItem, OrderStatus, CreateOrderInput, OrdersAdapter } from "./types"
