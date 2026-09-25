import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { EmailOverview } from "@/features/admin/components/email/email-overview"
import { getEmailStats } from "@/features/email/repo"
import { isEmailConfigured } from "@/features/email/provider"

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
