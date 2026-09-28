import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin/components/theme/theme-tabs"
import { ActivePresets } from "@/features/admin/components/theme/active-presets"

export const dynamic = "force-dynamic"

export default function AdminThemePage() {
  return (
    <AdminShell title="Theme">
      <ThemeTabs />
      <ActivePresets />
    </AdminShell>
  )
}
