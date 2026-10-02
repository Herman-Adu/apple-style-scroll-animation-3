import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin"
import { ActivePresets } from "@/features/admin"

export const dynamic = "force-dynamic"

export default function AdminThemePage() {
  return (
    <AdminShell title="Theme">
      <ThemeTabs />
      <ActivePresets />
    </AdminShell>
  )
}
