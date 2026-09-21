import { AdminShell, EmailManager } from "@/features/admin"

export default function AdminEmailPage() {
  return (
    <AdminShell title="Email">
      <EmailManager />
    </AdminShell>
  )
}
