// Server-only public surface of the admin slice: the first data each admin page
// renders. Every loader is admin-gated inside the underlying server action.
import "server-only"
import { listAllOrdersAction } from "@/features/orders/server"
import type { Order } from "@/features/orders"
import { listUsersAction } from "@/lib/auth/db-actions"
import { listDiscountCodesAction } from "@/lib/discount-codes/db-actions"
import type { DiscountCode } from "@/lib/discount-codes/types"
import type { AdminCustomersData } from "./hooks/use-admin-customers"

export function loadAdminOrders(): Promise<Order[]> {
  return listAllOrdersAction()
}

export async function loadAdminCustomers(): Promise<AdminCustomersData> {
  const [users, orders] = await Promise.all([listUsersAction(), listAllOrdersAction()])
  return { users, orders }
}

export function loadAdminDiscountCodes(): Promise<DiscountCode[]> {
  return listDiscountCodesAction()
}
