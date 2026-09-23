import { AdminShell, CustomerDetail } from "@/features/admin"

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <AdminShell title="Customer">
      <CustomerDetail customerId={id} />
    </AdminShell>
  )
}
