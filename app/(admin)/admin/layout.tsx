import type { ReactNode } from "react"
import { AdminGuard } from "@/features/admin"
import { SettingsProvider } from "@/features/admin/hooks/use-settings"
import { getStoreSettingsAction } from "@/lib/settings/db-actions"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const initialSettings = await getStoreSettingsAction()
  return (
    <AdminGuard>
      <SettingsProvider initialSettings={initialSettings}>{children}</SettingsProvider>
    </AdminGuard>
  )
}
