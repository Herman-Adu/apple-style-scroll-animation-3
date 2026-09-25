import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { TemplateList } from "@/features/admin/components/email/template-list"
import { listTemplates } from "@/features/email/repo"

export const dynamic = "force-dynamic"

export default async function AdminEmailTemplatesPage() {
  const templates = await listTemplates()
  return (
    <AdminShell title="Email templates">
      <EmailTabs />
      <TemplateList
        templates={templates.map((t) => ({
          id: t.id,
          key: t.key,
          name: t.name,
          category: t.category,
          subject: t.subject,
          description: t.description,
          blocks: t.blocks,
          isSystem: t.isSystem,
          updatedAt: t.updatedAt,
        }))}
      />
    </AdminShell>
  )
}
