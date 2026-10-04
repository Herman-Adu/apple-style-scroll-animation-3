// Infrastructure adapter: Neon Postgres backend for orders, reached through
// Server Actions. Implements the same OrdersAdapter port as the localStorage
// reference, so the hooks and UI can't tell them apart. All identity scoping
// and admin checks live server-side in ../db-actions — this file is a thin
// client-facing shim over those actions.

import {
  addTrackingAction,
  createOrderAction,
  listAllOrdersAction,
  listMyOrdersAction,
  updateOrderStatusAction,
} from "../actions/orders"
import { refundOrderAction } from "../actions/refunds"
import type { Carrier } from "../domain/tracking"
import type { CreateOrderInput, Order, OrderStatus, OrdersAdapter } from "../domain/types"

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

    async refund(orderId: string, amount?: number, reason?: string): Promise<Order> {
      return refundOrderAction(orderId, amount, reason)
    },

    async addTracking(
      orderId: string,
      input: { carrier: Carrier; trackingNumber: string; trackingUrl?: string },
    ): Promise<Order> {
      return addTrackingAction(orderId, input)
    },
  }
}
