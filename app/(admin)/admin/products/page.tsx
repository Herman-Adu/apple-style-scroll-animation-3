import { Suspense } from "react"
import { AdminLoading, AdminShell, ProductManager } from "@/features/admin"
import { getWaitingDemandAction } from "@/features/stock-alerts"

export default function AdminProductsPage() {
  return (
    <AdminShell title="Products">
      <Suspense fallback={<AdminLoading label="products" />}>
        <ProductManager demandPromise={getWaitingDemandAction()} />
      </Suspense>
    </AdminShell>
  )
}
