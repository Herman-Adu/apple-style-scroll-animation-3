import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin/components/theme/theme-tabs"
import { ThemeTemplatesManager } from "@/features/admin/components/theme/theme-templates-manager"

export const dynamic = "force-dynamic"

export default function AdminThemeTemplatesPage() {
  return (
    <AdminShell title="Theme templates">
      <ThemeTabs />
      <ThemeTemplatesManager />
    </AdminShell>
  )
}
