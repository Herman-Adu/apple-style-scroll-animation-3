import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin"
import { EmailOverview } from "@/features/admin"
import { getEmailStats } from "@/features/email/server"
import { isEmailConfigured } from "@/features/email/server"

export const dynamic = "force-dynamic"

export default async function AdminEmailPage() {
  const stats = await getEmailStats()
  return (
    <AdminShell title="Email">
      <EmailTabs />
      <EmailOverview stats={stats} configured={isEmailConfigured()} />
    </AdminShell>
  )
}
