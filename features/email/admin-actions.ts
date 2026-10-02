"use server"

import { revalidatePath } from "next/cache"
import { sendEmail } from "./provider"
import { renderEmail, renderText } from "./blocks/render"
import type { EmailBlock, EmailBranding } from "./blocks/types"
import { sampleVars, SAMPLE_ORDER_SUMMARY, SAMPLE_LOW_STOCK_ITEMS } from "./blocks/sample"
import { getBaseUrl } from "@/lib/seo/site"
import { validateSectionInput, type SectionBlock } from "./sections"

/**
 * Final in-code fallback reply-to for customer messages, used when neither the
 * branding support email nor EMAIL_TO is set. Points at the admin domain.
 */
const DEFAULT_ADMIN_EMAIL = "admin@adudev.co.uk"
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
  resetCustomTemplate,
  listTemplateVersions,
  restoreTemplateVersion,
  listSavedSections,
  createSavedSection,
  renameSavedSection,
  deleteSavedSection,
  type TemplateRow,
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

function templateResult(row: TemplateRow) {
  return {
    ok: true as const,
    template: {
      name: row.name,
      category: row.category,
      subject: row.subject,
      previewText: row.previewText,
      description: row.description,
      blocks: row.blocks,
    },
  }
}

/** System templates reset to their built-in default; custom ones to their original version. */
export async function resetTemplateAction(id: number) {
  const tpl = await getTemplate(id)
  if (!tpl) return { ok: false as const, error: "Template not found" }
  const row = tpl.isSystem ? await resetSystemTemplate(id) : await resetCustomTemplate(id)
  if (!row) return { ok: false as const, error: "Could not find a version to reset to" }
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${id}`)
  return templateResult(row)
}

export async function listTemplateVersionsAction(templateId: number) {
  const versions = await listTemplateVersions(templateId)
  return versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))
}

// ---------- Saved sections ----------

export async function listSavedSectionsAction() {
  const rows = await listSavedSections()
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))
}

export async function createSavedSectionAction(input: { name: string; blocks: SectionBlock[] }) {
  const check = validateSectionInput(input)
  if (!check.ok) return check
  const row = await createSavedSection({ name: check.name, blocks: input.blocks })
  return { ok: true as const, id: row.id }
}

export async function renameSavedSectionAction(id: number, name: string) {
  const check = validateSectionInput({ name, blocks: [{ type: "divider" } as SectionBlock] })
  if (!check.ok) return check
  await renameSavedSection(id, check.name)
  return { ok: true as const }
}

export async function deleteSavedSectionAction(id: number) {
  await deleteSavedSection(id)
  return { ok: true as const }
}

export async function restoreTemplateVersionAction(templateId: number, versionId: number) {
  const row = await restoreTemplateVersion(templateId, versionId)
  if (!row) return { ok: false as const, error: "That version no longer exists" }
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${templateId}`)
  return templateResult(row)
}

/** Send a template to a single address as a real test of the built email. */
export async function sendTemplateTestAction(input: { id: number; to: string }) {
  const [tpl, branding] = await Promise.all([getTemplate(input.id), getBranding()])
  if (!tpl) return { ok: false as const, error: "Template not found" }
  const baseUrl = getBaseUrl()
  // shop_url/order_url must be absolute for a real sent email (no page origin to
  // resolve relative links against), unlike the in-app builder preview.
  const vars = { ...sampleVars(branding), shop_url: `${baseUrl}/products`, order_url: `${baseUrl}/account?tab=orders` }
  const dynamic = { orderSummary: SAMPLE_ORDER_SUMMARY, lowStockItems: SAMPLE_LOW_STOCK_ITEMS }
  const html = renderEmail(tpl.blocks, branding, { vars, baseUrl, dynamic })
  const text = renderText(tpl.blocks, branding, { vars, dynamic })
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
  const html = renderEmail(blocks, branding, { vars, baseUrl: getBaseUrl() })
  const text = renderText(blocks, branding, { vars })
  const replyTo = branding.supportEmail || process.env.EMAIL_TO || DEFAULT_ADMIN_EMAIL

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
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  revalidatePath(`${EMAIL_BASE}/campaigns/${id}`)
  return { ok: true as const, sent, failed, skipped, recipients: recipients.length }
}

// ---------- helpers ----------

function fill(s: string, vars: Record<string, string>): string {
  return String(s ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "")
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
