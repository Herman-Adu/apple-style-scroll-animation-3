import { Suspense } from "react"
import { AdminLoading, AdminShell, AnalyticsPanel, OfferAnalyticsPanel } from "@/features/admin"
import { loadAdminCustomers, loadAdminOrders } from "@/features/admin/server"

export default function AdminAnalyticsPage() {
  const ordersPromise = loadAdminOrders()
  const customersPromise = loadAdminCustomers()
  return (
    <AdminShell title="Analytics">
      <div className="flex flex-col gap-10">
        <Suspense fallback={<AdminLoading label="analytics" />}>
          <AnalyticsPanel ordersPromise={ordersPromise} />
        </Suspense>
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Offers</h2>
            <p className="text-sm text-muted-foreground">
              Personal offer performance — sends, redemptions and conversion.
            </p>
          </div>
          <Suspense fallback={<AdminLoading label="offers" />}>
            <OfferAnalyticsPanel customersPromise={customersPromise} />
          </Suspense>
        </section>
      </div>
    </AdminShell>
  )
}
