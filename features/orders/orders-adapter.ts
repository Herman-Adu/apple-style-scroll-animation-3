// Single seam where the orders backend is selected. Defaults to the `db`
// adapter (Neon Postgres via Server Actions), matching the auth layer. Set
// NEXT_PUBLIC_AUTH_PROVIDER=local for the zero-backend localStorage reference —
// the UI, hooks, and types below never change.

import { createDbOrdersAdapter } from "./adapters/db"
import { createLocalOrdersAdapter } from "./adapters/local"

const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || "db"

export const ordersAdapter =
  provider === "local" ? createLocalOrdersAdapter() : createDbOrdersAdapter()

export type { Order, OrderItem, OrderStatus, CreateOrderInput, OrdersAdapter } from "./types"
