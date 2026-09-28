import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin/components/theme/theme-tabs"
import { HeadingStyleForm } from "@/features/admin/components/theme/heading-style-form"

export const dynamic = "force-dynamic"

export default function AdminThemeHeadingsPage() {
  return (
    <AdminShell title="Headings & style">
      <ThemeTabs />
      <HeadingStyleForm />
    </AdminShell>
  )
}
