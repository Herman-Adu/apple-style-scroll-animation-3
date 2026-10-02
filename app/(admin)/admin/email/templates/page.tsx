import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin"
import { TemplateList } from "@/features/admin"
import { listTemplates } from "@/features/email/server"

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
