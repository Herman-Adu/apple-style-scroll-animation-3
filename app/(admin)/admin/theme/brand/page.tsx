import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin/components/theme/theme-tabs"
import { BrandColorsForm } from "@/features/admin/components/theme/brand-colors-form"

export const dynamic = "force-dynamic"

export default function AdminThemeBrandPage() {
  return (
    <AdminShell title="Brand colours">
      <ThemeTabs />
      <BrandColorsForm />
    </AdminShell>
  )
}
