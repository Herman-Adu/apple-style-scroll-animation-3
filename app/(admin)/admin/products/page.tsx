import { AdminShell, ProductManager } from "@/features/admin"

export default function AdminProductsPage() {
  return (
    <AdminShell title="Products">
      <ProductManager />
    </AdminShell>
  )
}
