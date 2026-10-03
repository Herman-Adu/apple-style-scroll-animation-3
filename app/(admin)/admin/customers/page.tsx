import { Suspense } from "react"
import { AdminLoading, AdminShell, CustomerManager } from "@/features/admin"
import { loadAdminCustomers } from "@/features/admin/server"

export default function AdminCustomersPage() {
  return (
    <AdminShell title="Customers">
      <Suspense fallback={<AdminLoading label="customers" />}>
        <CustomerManager customersPromise={loadAdminCustomers()} />
      </Suspense>
    </AdminShell>
  )
}
