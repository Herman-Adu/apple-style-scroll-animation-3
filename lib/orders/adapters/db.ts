// Infrastructure adapter: Neon Postgres backend for orders, reached through
// Server Actions. Implements the same OrdersAdapter port as the localStorage
// reference, so the hooks and UI can't tell them apart. All identity scoping
// and admin checks live server-side in ../db-actions — this file is a thin
// client-facing shim over those actions.

import {
  createOrderAction,
  listAllOrdersAction,
  listMyOrdersAction,
  updateOrderStatusAction,
} from "../db-actions"
import type { CreateOrderInput, Order, OrderStatus, OrdersAdapter } from "../types"

export function createDbOrdersAdapter(): OrdersAdapter {
  return {
    // `userId` is part of the port for the local adapter; the server ignores it
    // and scopes to the session user, so it can't be used to read another's data.
    async list(_userId: string): Promise<Order[]> {
      return listMyOrdersAction()
    },

    async listAll(): Promise<Order[]> {
      return listAllOrdersAction()
    },

    async create(input: CreateOrderInput): Promise<Order> {
      return createOrderAction(input)
    },

    async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
      return updateOrderStatusAction(orderId, status)
    },
  }
}
