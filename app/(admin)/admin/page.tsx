import { Suspense } from "react"
import { AdminLoading, AdminShell, DashboardOverview } from "@/features/admin"
import { loadAdminOrders } from "@/features/admin/server"
import { getWaitingDemandAction } from "@/features/stock-alerts"

export default function AdminOverviewPage() {
  return (
    <AdminShell title="Overview">
      <Suspense fallback={<AdminLoading label="overview" />}>
        <DashboardOverview ordersPromise={loadAdminOrders()} demandPromise={getWaitingDemandAction()} />
      </Suspense>
    </AdminShell>
  )
}
