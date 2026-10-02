import { notFound } from "next/navigation"
import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { TemplateEditor } from "@/features/admin/components/email/template-editor"
import { getBranding, getTemplate } from "@/features/email/repo"
import { getServerCanLockBlocks } from "@/lib/auth/server"
import { fetchProductImageMap } from "@/features/products/api"

export const dynamic = "force-dynamic"

export default async function AdminEmailTemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const templateId = Number(id)
  if (!Number.isFinite(templateId)) notFound()

  const [template, branding, products, canLock] = await Promise.all([
    getTemplate(templateId),
    getBranding(),
    fetchProductImageMap(),
    getServerCanLockBlocks(),
  ])
  if (!template) notFound()

  return (
    <AdminShell title="Edit template">
      <EmailTabs />
      <TemplateEditor
        template={{
          id: template.id,
          key: template.key,
          name: template.name,
          category: template.category,
          subject: template.subject,
          previewText: template.previewText,
          description: template.description,
          blocks: template.blocks,
          isSystem: template.isSystem,
          version: template.version,
        }}
        branding={branding}
        products={products}
        canLock={canLock}
      />
    </AdminShell>
  )
}
