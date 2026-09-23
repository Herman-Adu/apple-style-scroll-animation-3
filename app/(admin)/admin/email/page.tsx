import { Suspense } from "react"
import { AdminShell, EmailManager } from "@/features/admin"

export default function AdminEmailPage() {
  return (
    <AdminShell title="Email">
      <Suspense fallback={null}>
        <EmailManager />
      </Suspense>
    </AdminShell>
  )
}
