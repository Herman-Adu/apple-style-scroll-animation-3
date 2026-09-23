"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getAuthAdapter } from "@/lib/auth/adapters"
import type { OfferTag, User, UserRole, UserStatus } from "@/lib/auth/types"
import { ordersAdapter } from "@/features/orders"
import type { Order } from "@/features/orders"
import { buildCustomerRecords } from "@/features/customers"
import type { CustomerRecord } from "@/features/customers"

/**
 * Admin view of the customer base: every account left-joined with its orders,
 * plus the management mutators. Talks only to the AuthAdapter + OrdersAdapter
 * ports, so a Strapi/Stripe backend swaps in without touching this hook or the UI.
 *
 * No card or payment data is ever touched here — Stripe and Clerk own that.
 */
export function useAdminCustomers() {
  const adapter = useMemo(() => getAuthAdapter(), [])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [userList, orderList] = await Promise.all([adapter.listUsers(), ordersAdapter.listAll()])
    setUsers(userList)
    setOrders(orderList)
    setLoading(false)
  }, [adapter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const records: CustomerRecord[] = useMemo(
    () => buildCustomerRecords(users, orders),
    [users, orders],
  )

  // Optimistically patch the local user list so the UI updates immediately, then
  // reconcile with the value the adapter returns.
  const patchUser = useCallback((updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }, [])

  const setStatus = useCallback(
    async (id: string, status: UserStatus) => patchUser(await adapter.setUserStatus(id, status)),
    [adapter, patchUser],
  )

  const setRole = useCallback(
    async (id: string, role: UserRole) => patchUser(await adapter.setUserRole(id, role)),
    [adapter, patchUser],
  )

  const setNewsletter = useCallback(
    async (id: string, newsletter: boolean) =>
      patchUser(await adapter.setUserNewsletter(id, newsletter)),
    [adapter, patchUser],
  )

  const setOffers = useCallback(
    async (id: string, offers: OfferTag[]) => patchUser(await adapter.setUserOffers(id, offers)),
    [adapter, patchUser],
  )

  return { records, loading, refresh, setStatus, setRole, setNewsletter, setOffers }
}
