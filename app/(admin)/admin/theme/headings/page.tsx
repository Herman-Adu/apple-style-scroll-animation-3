import { AdminShell } from "@/features/admin"
import { ThemeTabs } from "@/features/admin"
import { HeadingStyleForm } from "@/features/admin"

export const dynamic = "force-dynamic"

export default function AdminThemeHeadingsPage() {
  return (
    <AdminShell title="Headings & style">
      <ThemeTabs />
      <HeadingStyleForm />
    </AdminShell>
  )
}
