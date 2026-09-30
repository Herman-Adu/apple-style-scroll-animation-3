import { AdminShell, DiscountCodeManager } from "@/features/admin"

export default function AdminDiscountsPage() {
  return (
    <AdminShell title="Discount codes">
      <DiscountCodeManager />
    </AdminShell>
  )
}
