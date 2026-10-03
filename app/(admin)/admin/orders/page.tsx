import { Suspense } from "react"
import { AdminLoading, AdminShell, OrderManager } from "@/features/admin"
import { loadAdminOrders } from "@/features/admin/server"

export default function AdminOrdersPage() {
  return (
    <AdminShell title="Orders">
      <Suspense fallback={<AdminLoading label="orders" />}>
        <OrderManager ordersPromise={loadAdminOrders()} />
      </Suspense>
    </AdminShell>
  )
}
