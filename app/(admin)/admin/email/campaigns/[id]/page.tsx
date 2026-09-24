import { notFound } from "next/navigation"
import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { CampaignEditor } from "@/features/admin/components/email/campaign-editor"
import { getBranding, getCampaign, listSubscribers, listTemplates } from "@/features/email/repo"

export const dynamic = "force-dynamic"

type AudienceType = "all_subscribers" | "manual"

export default async function AdminEmailCampaignEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campaignId = Number(id)
  if (!Number.isFinite(campaignId)) notFound()

  const [campaign, templates, subscribers, branding] = await Promise.all([
    getCampaign(campaignId),
    listTemplates(),
    listSubscribers(),
    getBranding(),
  ])
  if (!campaign) notFound()

  const audience = (campaign.audience as { type: AudienceType; emails?: string[] }) ?? { type: "all_subscribers" }

  return (
    <AdminShell title="Edit campaign">
      <EmailTabs />
      <CampaignEditor
        campaign={{
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          previewText: campaign.previewText,
          templateId: campaign.templateId,
          audience,
          status: campaign.status,
          stats: (campaign.stats as { recipients?: number; sent?: number; failed?: number; skipped?: number }) ?? null,
        }}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          subject: t.subject,
          blocks: t.blocks,
        }))}
        branding={branding}
        optedInCount={subscribers.filter((s) => s.optedIn).length}
      />
    </AdminShell>
  )
}
