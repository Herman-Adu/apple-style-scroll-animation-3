"use client"

import { useCallback, useEffect, useState } from "react"
import { ordersAdapter } from "@/lib/orders"
import type { CreateOrderInput, Order } from "@/lib/orders/types"

/**
 * Client access to the orders backend. Reads the signed-in user's orders and
 * exposes a `createOrder` that records a new one and refreshes the list.
 * Backend-agnostic — it only talks to the OrdersAdapter port.
 */
export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }
    setLoading(true)
    const list = await ordersAdapter.list(userId)
    setOrders(list)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createOrder = useCallback(
    async (input: CreateOrderInput) => {
      const order = await ordersAdapter.create(input)
      await refresh()
      return order
    },
    [refresh],
  )

  return { orders, loading, createOrder, refresh }
}
