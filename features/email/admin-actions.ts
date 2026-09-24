"use server"

import { revalidatePath } from "next/cache"
import { sendEmail } from "./provider"
import { renderEmail, renderText } from "./blocks/render"
import type { EmailBlock, EmailBranding } from "./blocks/types"
import { getBaseUrl } from "@/lib/seo/site"
import {
  type AudienceSpec,
  createCampaign,
  createPreset,
  createTemplate,
  deleteCampaign,
  deletePreset,
  deleteSubscriber,
  deleteTemplate,
  getBranding,
  getCampaign,
  getTemplate,
  recordLog,
  recordMessage,
  resetSystemTemplate,
  setSubscriberOptIn,
  updateCampaign,
  updateEmailSettings,
  updatePreset,
  updateTemplate,
  upsertSubscriber,
} from "./repo"

/**
 * Admin-facing server actions for the email management system. Thin wrappers
 * around the repo that also perform sends and revalidate the affected admin
 * routes. Kept separate from the transactional actions so client components can
 * import these without pulling transactional entry points.
 */

const EMAIL_BASE = "/admin/email"

// ---------- Settings ----------

export async function saveEmailSettings(patch: Partial<EmailBranding>) {
  await updateEmailSettings(patch)
  revalidatePath(`${EMAIL_BASE}/settings`)
  revalidatePath(EMAIL_BASE)
  return { ok: true as const }
}

// ---------- Templates ----------

export async function createTemplateAction(input: {
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
}) {
  const row = await createTemplate(input)
  revalidatePath(`${EMAIL_BASE}/templates`)
  return { ok: true as const, id: row.id }
}

export async function saveTemplateAction(
  id: number,
  patch: Partial<{
    name: string
    category: string
    subject: string
    previewText: string
    description: string
    blocks: EmailBlock[]
  }>,
) {
  await updateTemplate(id, patch)
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${id}`)
  return { ok: true as const }
}

export async function deleteTemplateAction(id: number) {
  await deleteTemplate(id)
  revalidatePath(`${EMAIL_BASE}/templates`)
  return { ok: true as const }
}

export async function resetTemplateAction(id: number) {
  await resetSystemTemplate(id)
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${id}`)
  return { ok: true as const }
}

/** Send a template to a single address as a real test of the built email. */
export async function sendTemplateTestAction(input: { id: number; to: string }) {
  const [tpl, branding] = await Promise.all([getTemplate(input.id), getBranding()])
  if (!tpl) return { ok: false as const, error: "Template not found" }
  const vars = sampleVars(branding)
  const html = renderEmail(tpl.blocks, branding, { vars })
  const text = renderText(tpl.blocks, branding, { vars })
  const subject = fill(tpl.subject, vars)
  const result = await sendEmail({ to: input.to, subject, html, text, replyTo: branding.supportEmail || undefined })
  await recordLog({
    to: input.to,
    subject,
    templateKey: tpl.key,
    type: "test",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error ?? "Send failed" }
}

// ---------- Presets ----------

export async function createPresetAction(input: { name: string; category: string; subject: string; body: string }) {
  await createPreset(input)
  revalidatePath(`${EMAIL_BASE}/messages`)
  return { ok: true as const }
}
export async function savePresetAction(
  id: number,
  patch: Partial<{ name: string; category: string; subject: string; body: string }>,
) {
  await updatePreset(id, patch)
  revalidatePath(`${EMAIL_BASE}/messages`)
  return { ok: true as const }
}
export async function deletePresetAction(id: number) {
  await deletePreset(id)
  revalidatePath(`${EMAIL_BASE}/messages`)
  return { ok: true as const }
}

// ---------- Customer messages ----------

/**
 * Send an admin -> customer message. The plain body is wrapped in the branded
 * shell (hero + paragraphs). Reply-To is set to the support address so customer
 * replies land in the team inbox.
 */
export async function sendCustomerMessageAction(input: {
  to: string
  name?: string
  subject: string
  body: string
  presetId?: number | null
  heading?: string
}) {
  if (!input.to.trim() || !input.subject.trim() || !input.body.trim()) {
    return { ok: false as const, error: "Recipient, subject and message are required." }
  }
  const branding = await getBranding()
  const vars: Record<string, string> = {
    customer_name: input.name || "there",
    brand_name: branding.brandName,
    shop_url: `${getBaseUrl()}/products`,
  }
  const blocks: EmailBlock[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: branding.brandName,
      heading: input.heading?.trim() || input.subject,
      subheading: "",
      imageUrl: branding.heroImageUrl || "/email/hero-momo.png",
      align: "left",
    },
    ...input.body
      .split(/\n{2,}/)
      .map((para) => para.trim())
      .filter(Boolean)
      .map<EmailBlock>((para, i) => ({ id: `p-${i}`, type: "text", text: para, align: "left" })),
  ]
  const html = renderEmail(blocks, branding, { vars })
  const text = renderText(blocks, branding, { vars })
  const replyTo = branding.supportEmail || process.env.EMAIL_TO || undefined

  const result = await sendEmail({ to: input.to, subject: input.subject, html, text, replyTo })
  await recordMessage({
    customerEmail: input.to,
    customerName: input.name,
    subject: input.subject,
    body: input.body,
    presetId: input.presetId ?? null,
    replyTo: replyTo ?? "",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  await recordLog({
    to: input.to,
    subject: input.subject,
    templateKey: "customer_message",
    type: "message",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  revalidatePath(`${EMAIL_BASE}/messages`)
  return result.ok ? { ok: true as const, skipped: result.ok && "skipped" in result ? result.skipped : false } : { ok: false as const, error: result.error ?? "Send failed" }
}

// ---------- Subscribers ----------

export async function addSubscriberAction(input: { email: string; name?: string }) {
  await upsertSubscriber({ email: input.email.trim().toLowerCase(), name: input.name, source: "manual" })
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}
export async function toggleSubscriberAction(id: number, optedIn: boolean) {
  await setSubscriberOptIn(id, optedIn)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}
export async function removeSubscriberAction(id: number) {
  await deleteSubscriber(id)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}

// ---------- Campaigns ----------

export async function createCampaignAction(input: {
  name: string
  templateId?: number | null
  subject: string
  previewText: string
  audience: AudienceSpec
}) {
  const row = await createCampaign(input)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const, id: row.id }
}
export async function saveCampaignAction(
  id: number,
  patch: Partial<{
    name: string
    templateId: number | null
    subject: string
    previewText: string
    audience: AudienceSpec
  }>,
) {
  await updateCampaign(id, patch)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  revalidatePath(`${EMAIL_BASE}/campaigns/${id}`)
  return { ok: true as const }
}
export async function deleteCampaignAction(id: number) {
  await deleteCampaign(id)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}

/**
 * Send a campaign to its resolved audience. Renders the linked template per
 * recipient with branding, sends sequentially (small volumes; keeps us well
 * within Resend rate limits), tallies stats, and marks the campaign sent.
 */
export async function sendCampaignAction(id: number) {
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
    const html = renderEmail(tpl.blocks, branding, { vars })
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
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  revalidatePath(`${EMAIL_BASE}/campaigns/${id}`)
  return { ok: true as const, sent, failed, skipped, recipients: recipients.length }
}

// ---------- helpers ----------

function fill(s: string, vars: Record<string, string>): string {
  return String(s ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "")
}

function sampleVars(branding: EmailBranding): Record<string, string> {
  return {
    customer_name: "Ada Lovelace",
    brand_name: branding.brandName,
    order_number: "MOMO-1024",
    shop_url: `${getBaseUrl()}/products`,
    offer_headline: "15% off",
    offer_label: "Welcome offer",
    offer_expiry: "Valid until 31 December 2026.",
  }
}

async function resolveAudience(spec: AudienceSpec): Promise<{ email: string; name: string }[]> {
  if (spec.type === "manual") {
    return (spec.emails ?? []).map((e) => ({ email: e.trim(), name: "" })).filter((r) => r.email)
  }
  // all_subscribers — opted-in only
  const { listSubscribers } = await import("./repo")
  const subs = await listSubscribers()
  return subs.filter((s) => s.optedIn).map((s) => ({ email: s.email, name: s.name }))
}
