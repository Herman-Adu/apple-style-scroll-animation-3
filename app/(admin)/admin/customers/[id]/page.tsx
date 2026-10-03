import { Suspense } from "react"
import { AdminLoading, AdminShell, CustomerDetail } from "@/features/admin"
import { loadAdminCustomers } from "@/features/admin/server"

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <AdminShell title="Customer">
      <Suspense fallback={<AdminLoading label="customer" />}>
        <CustomerDetail customerId={id} customersPromise={loadAdminCustomers()} />
      </Suspense>
    </AdminShell>
  )
}
