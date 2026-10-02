import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin"
import { SettingsForm } from "@/features/admin"
import { getBranding } from "@/features/email/server"

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
