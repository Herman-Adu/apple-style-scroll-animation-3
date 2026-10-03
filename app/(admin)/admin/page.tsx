import { Suspense } from "react"
import { AdminLoading, AdminShell, DashboardOverview } from "@/features/admin"
import { loadAdminOrders } from "@/features/admin/server"

export default function AdminOverviewPage() {
  return (
    <AdminShell title="Overview">
      <Suspense fallback={<AdminLoading label="overview" />}>
        <DashboardOverview ordersPromise={loadAdminOrders()} />
      </Suspense>
    </AdminShell>
  )
}
