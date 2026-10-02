import "server-only"

import { revalidatePath } from "next/cache"
import { getBaseUrl } from "@/lib/seo/site"
import { renderEmail, renderText } from "./blocks/render"
import { sendEmail } from "./provider"
import {
  type AudienceSpec,
  getBranding,
  getCampaign,
  getTemplate,
  listSubscribers,
  recordLog,
  updateCampaign,
} from "./repo"

/**
 * Campaign sending, kept out of the "use server" actions file so trusted
 * server callers (the cron route, authenticated by CRON_SECRET) can use it
 * without an admin session. Anything exported from a "use server" file is a
 * publicly callable action, so this must never be re-exported from there;
 * the admin entry point is `sendCampaignAction`, which checks the session first.
 */

export function fill(s: string, vars: Record<string, string>): string {
  return String(s ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "")
}

async function resolveAudience(spec: AudienceSpec): Promise<{ email: string; name: string }[]> {
  if (spec.type === "manual") {
    return (spec.emails ?? []).map((e) => ({ email: e.trim(), name: "" })).filter((r) => r.email)
  }
  const subs = await listSubscribers()
  return subs.filter((s) => s.optedIn).map((s) => ({ email: s.email, name: s.name }))
}

/**
 * Send a campaign to its resolved audience. Renders the linked template per
 * recipient with branding, sends sequentially (small volumes; keeps us well
 * within Resend rate limits), tallies stats, and marks the campaign sent.
 */
export async function sendCampaign(id: number) {
  const [campaign, branding] = await Promise.all([getCampaign(id), getBranding()])
  if (!campaign) return { ok: false as const, error: "Campaign not found" }
  if (!campaign.templateId) return { ok: false as const, error: "Attach a template before sending." }
  const tpl = await getTemplate(campaign.templateId)
  if (!tpl) return { ok: false as const, error: "Linked template no longer exists." }

  const recipients = await resolveAudience(campaign.audience as unknown as AudienceSpec)
  if (recipients.length === 0) return { ok: false as const, error: "Audience is empty." }

  await updateCampaign(id, { status: "sending" })
  const shopUrl = `${getBaseUrl()}/products`
  let sent = 0
  let failed = 0
  let skipped = 0

  for (const r of recipients) {
    const vars: Record<string, string> = {
      customer_name: r.name || "there",
      brand_name: branding.brandName,
      shop_url: shopUrl,
    }
    const subject = fill(campaign.subject || tpl.subject, vars)
    const html = renderEmail(tpl.blocks, branding, { vars, baseUrl: getBaseUrl() })
    const text = renderText(tpl.blocks, branding, { vars })
    const result = await sendEmail({ to: r.email, subject, html, text, replyTo: branding.supportEmail || undefined })
    if (!result.ok) failed++
    else if ("skipped" in result && result.skipped) skipped++
    else sent++
    await recordLog({
      to: r.email,
      subject,
      templateKey: tpl.key,
      type: "campaign",
      relatedId: String(id),
      resendId: result.ok && result.id ? result.id : "",
      status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
    })
  }

  await updateCampaign(id, {
    status: "sent",
    sentAt: new Date(),
    stats: { recipients: recipients.length, sent, failed, skipped },
  })
  revalidatePath("/admin/email/campaigns")
  revalidatePath(`/admin/email/campaigns/${id}`)
  return { ok: true as const, sent, failed, skipped, recipients: recipients.length }
}
