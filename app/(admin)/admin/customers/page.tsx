import { Suspense } from "react"
import { AdminShell, CustomerManager } from "@/features/admin"

export default function AdminCustomersPage() {
  return (
    <AdminShell title="Customers">
      <Suspense fallback={<p className="py-10 text-center text-muted-foreground">Loading customers…</p>}>
        <CustomerManager />
      </Suspense>
    </AdminShell>
  )
}
