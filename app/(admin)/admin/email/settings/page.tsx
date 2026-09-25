import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { SettingsForm } from "@/features/admin/components/email/settings-form"
import { getBranding } from "@/features/email/repo"

export const dynamic = "force-dynamic"

export default async function AdminEmailSettingsPage() {
  const branding = await getBranding()
  return (
    <AdminShell title="Email settings">
      <EmailTabs />
      <SettingsForm branding={branding} />
    </AdminShell>
  )
}
