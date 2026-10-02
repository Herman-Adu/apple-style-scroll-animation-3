"use server"

import { revalidatePath } from "next/cache"
import { sendEmail } from "./provider"
import { renderEmail, renderText } from "./blocks/render"
import type { EmailBlock, EmailBranding } from "./blocks/types"
import { sampleVars, SAMPLE_ORDER_SUMMARY, SAMPLE_LOW_STOCK_ITEMS } from "./blocks/sample"
import { getBaseUrl } from "@/lib/seo/site"
import { validateSectionInput, type SectionBlock } from "./sections"
import { lockViolations } from "./locks"
import { fill, sendCampaign } from "./campaign-send"
import { getServerCanLockBlocks, requireAdmin } from "@/lib/auth/server"

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

const LOCKED_BY_ADMIN = "Some blocks are locked. Ask an admin who can lock blocks to change them."

/** Reset/restore replace every block, so only admins who can lock may run them on a template with locks. */
async function blockedByLocks(blocks: EmailBlock[]): Promise<boolean> {
  return blocks.some((b) => b.locked) && !(await getServerCanLockBlocks())
}

// ---------- Settings ----------

export async function saveEmailSettings(patch: Partial<EmailBranding>) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  if (patch.blocks && !(await getServerCanLockBlocks())) {
    const current = await getTemplate(id)
    if (current && lockViolations(current.blocks, patch.blocks).length > 0) {
      return { ok: false as const, error: LOCKED_BY_ADMIN }
    }
  }
  await updateTemplate(id, patch)
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${id}`)
  return { ok: true as const }
}

export async function deleteTemplateAction(id: number) {
  await requireAdmin()
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
  await requireAdmin()
  const tpl = await getTemplate(id)
  if (!tpl) return { ok: false as const, error: "Template not found" }
  if (await blockedByLocks(tpl.blocks)) return { ok: false as const, error: LOCKED_BY_ADMIN }
  const row = tpl.isSystem ? await resetSystemTemplate(id) : await resetCustomTemplate(id)
  if (!row) return { ok: false as const, error: "Could not find a version to reset to" }
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${id}`)
  return templateResult(row)
}

export async function listTemplateVersionsAction(templateId: number) {
  await requireAdmin()
  const versions = await listTemplateVersions(templateId)
  return versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))
}

// ---------- Saved sections ----------

export async function listSavedSectionsAction() {
  await requireAdmin()
  const rows = await listSavedSections()
  return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))
}

export async function createSavedSectionAction(input: { name: string; blocks: SectionBlock[] }) {
  await requireAdmin()
  const check = validateSectionInput(input)
  if (!check.ok) return check
  const row = await createSavedSection({ name: check.name, blocks: input.blocks })
  return { ok: true as const, id: row.id }
}

export async function renameSavedSectionAction(id: number, name: string) {
  await requireAdmin()
  const check = validateSectionInput({ name, blocks: [{ type: "divider" } as SectionBlock] })
  if (!check.ok) return check
  await renameSavedSection(id, check.name)
  return { ok: true as const }
}

export async function deleteSavedSectionAction(id: number) {
  await requireAdmin()
  await deleteSavedSection(id)
  return { ok: true as const }
}

export async function restoreTemplateVersionAction(templateId: number, versionId: number) {
  await requireAdmin()
  const current = await getTemplate(templateId)
  if (current && (await blockedByLocks(current.blocks))) return { ok: false as const, error: LOCKED_BY_ADMIN }
  const row = await restoreTemplateVersion(templateId, versionId)
  if (!row) return { ok: false as const, error: "That version no longer exists" }
  revalidatePath(`${EMAIL_BASE}/templates`)
  revalidatePath(`${EMAIL_BASE}/templates/${templateId}`)
  return templateResult(row)
}

/** Send a template to a single address as a real test of the built email. */
export async function sendTemplateTestAction(input: { id: number; to: string }) {
  await requireAdmin()
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
  await requireAdmin()
  await createPreset(input)
  revalidatePath(`${EMAIL_BASE}/messages`)
  return { ok: true as const }
}
export async function savePresetAction(
  id: number,
  patch: Partial<{ name: string; category: string; subject: string; body: string }>,
) {
  await requireAdmin()
  await updatePreset(id, patch)
  revalidatePath(`${EMAIL_BASE}/messages`)
  return { ok: true as const }
}
export async function deletePresetAction(id: number) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  await upsertSubscriber({ email: input.email.trim().toLowerCase(), name: input.name, source: "manual" })
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}
export async function toggleSubscriberAction(id: number, optedIn: boolean) {
  await requireAdmin()
  await setSubscriberOptIn(id, optedIn)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}
export async function removeSubscriberAction(id: number) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  await updateCampaign(id, patch)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  revalidatePath(`${EMAIL_BASE}/campaigns/${id}`)
  return { ok: true as const }
}
export async function deleteCampaignAction(id: number) {
  await requireAdmin()
  await deleteCampaign(id)
  revalidatePath(`${EMAIL_BASE}/campaigns`)
  return { ok: true as const }
}

/** Admin "Send now". The cron route calls sendCampaign directly with its own secret check. */
export async function sendCampaignAction(id: number) {
  await requireAdmin()
  return sendCampaign(id)
}
