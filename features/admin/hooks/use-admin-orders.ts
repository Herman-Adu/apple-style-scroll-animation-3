"use client"

import { useCallback, useState } from "react"
import { ordersAdapter } from "@/features/orders"
import type { Order, OrderStatus } from "@/features/orders"
import type { Carrier } from "@/features/orders"
import { useLiveRefresh } from "@/hooks/use-live-refresh"

/**
 * Admin view of the orders backend: every customer's orders plus a status
 * mutator. The first list arrives from the server (see the admin pages), so
 * there is no client-side loading state; later refreshes go through the
 * OrdersAdapter port.
 */
export function useAdminOrders(initialOrders: Order[]) {
  const [orders, setOrders] = useState(initialOrders)

  const refresh = useCallback(async () => {
    setOrders(await ordersAdapter.listAll())
  }, [])

  // Keep polling while the tab is visible, and refresh instantly on refocus,
  // so a sale/refund/status change made elsewhere shows up without a reload.
  useLiveRefresh(refresh)

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      await ordersAdapter.updateStatus(orderId, status)
      await refresh()
    },
    [refresh],
  )

  /** Full (omit amount) or partial refund via Stripe. Throws on failure so the
   * caller can surface the specific error (e.g. "already fully refunded"). */
  const refund = useCallback(
    async (orderId: string, amount?: number, reason?: string) => {
      await ordersAdapter.refund(orderId, amount, reason)
      await refresh()
    },
    [refresh],
  )

  /** Save shipment tracking. Fires the customer shipping-confirmation email on
   * first save only (see addTrackingAction); later edits are silent. */
  const addTracking = useCallback(
    async (orderId: string, input: { carrier: Carrier; trackingNumber: string; trackingUrl?: string }) => {
      await ordersAdapter.addTracking(orderId, input)
      await refresh()
    },
    [refresh],
  )

  return { orders, updateStatus, refund, addTracking, refresh }
}
