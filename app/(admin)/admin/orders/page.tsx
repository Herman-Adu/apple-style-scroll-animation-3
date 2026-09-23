import { AdminShell, OrderManager } from "@/features/admin"

export default function AdminOrdersPage() {
  return (
    <AdminShell title="Orders">
      <OrderManager />
    </AdminShell>
  )
}
