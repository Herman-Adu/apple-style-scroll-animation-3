import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin"
import { BrandColorsForm } from "@/features/admin"

export const dynamic = "force-dynamic"

export default function AdminThemeBrandPage() {
  return (
    <AdminShell title="Brand colours">
      <ThemeTabs />
      <BrandColorsForm />
    </AdminShell>
  )
}
