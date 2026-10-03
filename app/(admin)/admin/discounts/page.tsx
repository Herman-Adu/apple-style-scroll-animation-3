import { Suspense } from "react"
import { AdminLoading, AdminShell, DiscountCodeManager } from "@/features/admin"
import { loadAdminDiscountCodes } from "@/features/admin/server"

export default function AdminDiscountsPage() {
  return (
    <AdminShell title="Discount codes">
      <Suspense fallback={<AdminLoading label="discount codes" />}>
        <DiscountCodeManager codesPromise={loadAdminDiscountCodes()} />
      </Suspense>
    </AdminShell>
  )
}
