"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ordersAdapter } from "@/features/orders"
import type { Order, OrderStatus } from "@/features/orders"
import type { Carrier } from "@/lib/orders/tracking"
import { useLiveRefresh } from "@/hooks/use-live-refresh"

/**
 * Admin view of the orders backend: every customer's orders plus a status
 * mutator. Talks only to the OrdersAdapter port, so a Stripe/server adapter
 * swaps in without touching this hook or the UI.
 */
export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)

  const refresh = useCallback(async () => {
    // Only show the loading state on the very first fetch — background
    // polls shouldn't flash the table back to its skeleton/empty state.
    if (!hasLoadedOnce.current) setLoading(true)
    const list = await ordersAdapter.listAll()
    setOrders(list)
    setLoading(false)
    hasLoadedOnce.current = true
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

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

  return { orders, loading, updateStatus, refund, addTracking, refresh }
}
