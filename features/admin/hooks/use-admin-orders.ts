"use client"

import { useCallback, useEffect, useState } from "react"
import { ordersAdapter } from "@/features/orders"
import type { Order, OrderStatus } from "@/features/orders"

/**
 * Admin view of the orders backend: every customer's orders plus a status
 * mutator. Talks only to the OrdersAdapter port, so a Stripe/server adapter
 * swaps in without touching this hook or the UI.
 */
export function useAdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await ordersAdapter.listAll()
    setOrders(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      await ordersAdapter.updateStatus(orderId, status)
      await refresh()
    },
    [refresh],
  )

  return { orders, loading, updateStatus, refresh }
}
