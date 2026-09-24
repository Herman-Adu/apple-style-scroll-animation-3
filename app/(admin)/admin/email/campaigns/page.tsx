import { AdminShell } from "@/features/admin"
import { EmailTabs } from "@/features/admin/components/email/email-tabs"
import { CampaignList } from "@/features/admin/components/email/campaign-list"
import { listCampaigns, listSubscribers } from "@/features/email/repo"

export const dynamic = "force-dynamic"

export default async function AdminEmailCampaignsPage() {
  const [campaigns, subscribers] = await Promise.all([listCampaigns(), listSubscribers()])
  return (
    <AdminShell title="Campaigns">
      <EmailTabs />
      <CampaignList
        campaigns={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          status: c.status,
          stats: (c.stats as CampaignList_Stats) ?? null,
          updatedAt: c.updatedAt,
          sentAt: c.sentAt,
        }))}
        subscribers={subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          name: s.name,
          optedIn: s.optedIn,
          source: s.source,
        }))}
      />
    </AdminShell>
  )
}

type CampaignList_Stats = { recipients?: number; sent?: number; failed?: number; skipped?: number } | null
