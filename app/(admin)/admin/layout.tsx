import type { ReactNode } from "react"
import { AdminGuard } from "@/features/admin"
import { SettingsProvider } from "@/features/admin"
import { getStoreSettingsAction } from "@/features/settings/actions"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const initialSettings = await getStoreSettingsAction()
  return (
    <AdminGuard>
      <SettingsProvider initialSettings={initialSettings}>{children}</SettingsProvider>
    </AdminGuard>
  )
}
