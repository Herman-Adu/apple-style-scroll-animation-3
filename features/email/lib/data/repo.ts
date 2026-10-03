import "server-only"

import { prisma } from "@/lib/db/prisma"
import { DEFAULT_BRANDING, type EmailBlock, type EmailBranding } from "../blocks/types"
import { SYSTEM_TEMPLATES, SYSTEM_PRESETS } from "../blocks/system-templates"
import { pickOriginalVersion, versionIdsToPrune, type TemplateContent, type VersionReason } from "../content/versions"
import type { SectionBlock } from "../content/sections"
import { getStoreSettingsAction } from "@/features/settings/actions"
import { getActiveTheme, resolveTokens } from "@/features/settings"

/**
 * Resolve the accent the active site theme wants emails to use. This is the
 * single-source-of-truth link: emails inherit the brand accent unless a
 * campaign explicitly overrides it. Emails render on a light paper shell, so we
 * take the theme's LIGHT-scheme accent. Failures fall back to the email default
 * so a send never breaks on a settings read.
 */
async function getThemeAccent(): Promise<string> {
  try {
    const settings = await getStoreSettingsAction()
    const theme = getActiveTheme(settings.theme)
    return resolveTokens(theme, "light").accent
  } catch {
    return DEFAULT_BRANDING.accentColor
  }
}

/**
 * Server-only data access for the email system. All admin server actions go
 * through here so Prisma is never imported into client code. Kept intentionally
 * thin and Strapi-portable: plain reads/writes, JSON in / JSON out.
 */

export type TemplateRow = {
  id: number
  key: string
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
  isSystem: boolean
  version: number
  updatedAt: Date
}

// ---------- Settings ----------

/** Load the singleton settings row, creating it with defaults on first use. */
export async function getEmailSettings(): Promise<EmailBranding & { id: number }> {
  const existing = await prisma.emailSettings.findFirst({ orderBy: { id: "asc" } })
  const row =
    existing ??
    (await prisma.emailSettings.create({
      data: {
        brandName: DEFAULT_BRANDING.brandName,
        fromName: DEFAULT_BRANDING.fromName,
        accentColor: DEFAULT_BRANDING.accentColor,
        footerText: DEFAULT_BRANDING.footerText,
        footerCities: DEFAULT_BRANDING.footerCities,
      },
    }))
  return {
    id: row.id,
    brandName: row.brandName,
    fromName: row.fromName,
    supportEmail: row.supportEmail,
    heroImageUrl: row.heroImageUrl,
    accentColor: row.accentColor,
    footerText: row.footerText,
    footerCities: row.footerCities,
    address: row.address,
  }
}

export async function updateEmailSettings(patch: Partial<EmailBranding>): Promise<void> {
  const current = await getEmailSettings()
  await prisma.emailSettings.update({ where: { id: current.id }, data: patch })
}

/**
 * Branding for send/preview; falls back to defaults if the DB is unreachable.
 *
 * The accent is the single-source-of-truth link: when the email settings leave
 * `accentColor` blank (the default), emails inherit the active site theme's
 * accent. A non-empty `accentColor` is an explicit per-brand override (e.g. a
 * seasonal campaign) and always wins.
 */
export async function getBranding(): Promise<EmailBranding> {
  try {
    const s = await getEmailSettings()
    const merged = { ...DEFAULT_BRANDING, ...s }
    if (!s.accentColor?.trim()) {
      merged.accentColor = await getThemeAccent()
    }
    return merged
  } catch {
    return DEFAULT_BRANDING
  }
}

// ---------- Templates ----------

function toTemplateRow(r: {
  id: number
  key: string
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: unknown
  isSystem: boolean
  version: number
  updatedAt: Date
}): TemplateRow {
  return { ...r, blocks: (r.blocks as EmailBlock[]) ?? [] }
}

/** Insert any system templates that are not yet in the DB (idempotent). */
export async function seedSystemTemplates(): Promise<void> {
  for (const t of SYSTEM_TEMPLATES) {
    const exists = await prisma.emailTemplate.findUnique({ where: { key: t.key } })
    if (exists) continue
    await prisma.emailTemplate.create({
      data: {
        key: t.key,
        name: t.name,
        category: t.category,
        subject: t.subject,
        previewText: t.previewText,
        description: t.description,
        blocks: t.blocks as unknown as object,
        isSystem: true,
      },
    })
  }
}

export async function listTemplates(): Promise<TemplateRow[]> {
  await seedSystemTemplates()
  const rows = await prisma.emailTemplate.findMany({ orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }] })
  return rows.map(toTemplateRow)
}

export async function getTemplate(id: number): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } })
  return r ? toTemplateRow(r) : null
}

/** Blocks for a system template key, from DB override or the code default. */
export async function getTemplateBlocksByKey(key: string): Promise<EmailBlock[] | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { key } })
  return r ? ((r.blocks as unknown as EmailBlock[]) ?? null) : null
}

export async function createTemplate(input: {
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
}): Promise<TemplateRow> {
  const key = `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
  const r = await prisma.emailTemplate.create({
    data: {
      key,
      name: input.name,
      category: input.category,
      subject: input.subject,
      previewText: input.previewText,
      description: input.description,
      blocks: input.blocks as unknown as object,
      isSystem: false,
    },
  })
  await snapshotTemplate(r, "create")
  return toTemplateRow(r)
}

export async function updateTemplate(
  id: number,
  patch: Partial<{
    name: string
    category: string
    subject: string
    previewText: string
    description: string
    blocks: EmailBlock[]
  }>,
): Promise<void> {
  const current = await prisma.emailTemplate.findUnique({ where: { id } })
  if (current) await ensureBaseline(current)
  const data: Record<string, unknown> = { ...patch }
  if (patch.blocks) data.blocks = patch.blocks as unknown as object
  data.version = { increment: 1 }
  const updated = await prisma.emailTemplate.update({ where: { id }, data: data as never })
  await snapshotTemplate(updated, "save")
}

export async function deleteTemplate(id: number): Promise<void> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!r || r.isSystem) return // system templates cannot be deleted, only reset
  await prisma.emailTemplate.delete({ where: { id } })
}

/** Reset a system template's blocks/copy back to the code default. */
export async function resetSystemTemplate(id: number): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!r || !r.isSystem) return null
  const def = SYSTEM_TEMPLATES.find((t) => t.key === r.key)
  if (!def) return null
  await ensureBaseline(r)
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      name: def.name,
      category: def.category,
      subject: def.subject,
      previewText: def.previewText,
      description: def.description,
      blocks: def.blocks as unknown as object,
      version: { increment: 1 },
    },
  })
  await snapshotTemplate(updated, "reset")
  return toTemplateRow(updated)
}

// ---------- Template versions ----------

type SnapshotSource = {
  id: number
  version: number
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: unknown
}

export type TemplateVersionRow = {
  id: number
  version: number
  reason: string
  createdAt: Date
} & TemplateContent

/** Record the template's current content under its current version number (idempotent). */
async function snapshotTemplate(r: SnapshotSource, reason: VersionReason): Promise<void> {
  const content = {
    name: r.name,
    category: r.category,
    subject: r.subject,
    previewText: r.previewText,
    description: r.description,
    blocks: (r.blocks ?? []) as object,
  }
  await prisma.emailTemplateVersion.upsert({
    where: { templateId_version: { templateId: r.id, version: r.version } },
    create: { templateId: r.id, version: r.version, reason, ...content },
    update: {},
  })
  const all = await prisma.emailTemplateVersion.findMany({
    where: { templateId: r.id },
    select: { id: true, version: true },
  })
  const stale = versionIdsToPrune(all)
  if (stale.length) await prisma.emailTemplateVersion.deleteMany({ where: { id: { in: stale } } })
}

/** Templates saved before history existed have no snapshots; capture their
 *  pre-change state first so it can still be restored. */
async function ensureBaseline(r: SnapshotSource): Promise<void> {
  const count = await prisma.emailTemplateVersion.count({ where: { templateId: r.id } })
  if (count === 0) await snapshotTemplate(r, "baseline")
}

function toVersionRow(v: {
  id: number
  version: number
  reason: string
  createdAt: Date
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: unknown
}): TemplateVersionRow {
  return { ...v, blocks: (v.blocks as EmailBlock[]) ?? [] }
}

/** Newest first. Lazily creates a baseline so every template shows at least one entry. */
export async function listTemplateVersions(templateId: number): Promise<TemplateVersionRow[]> {
  const r = await prisma.emailTemplate.findUnique({ where: { id: templateId } })
  if (!r) return []
  await ensureBaseline(r)
  const rows = await prisma.emailTemplateVersion.findMany({
    where: { templateId },
    orderBy: { version: "desc" },
  })
  return rows.map(toVersionRow)
}

async function applyContent(id: number, content: TemplateContent, reason: VersionReason): Promise<TemplateRow> {
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      name: content.name,
      category: content.category,
      subject: content.subject,
      previewText: content.previewText,
      description: content.description,
      blocks: content.blocks as unknown as object,
      version: { increment: 1 },
    },
  })
  await snapshotTemplate(updated, reason)
  return toTemplateRow(updated)
}

/** Make an older snapshot the current content. Saved as a new version, so it can be undone too. */
export async function restoreTemplateVersion(templateId: number, versionId: number): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id: templateId } })
  if (!r) return null
  const v = await prisma.emailTemplateVersion.findUnique({ where: { id: versionId } })
  if (!v || v.templateId !== templateId) return null
  await ensureBaseline(r)
  return applyContent(templateId, toVersionRow(v), "restore")
}

/** Custom templates reset to their earliest snapshot (as first created or copied). */
export async function resetCustomTemplate(id: number): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } })
  if (!r || r.isSystem) return null
  await ensureBaseline(r)
  const versions = await prisma.emailTemplateVersion.findMany({ where: { templateId: id } })
  const original = pickOriginalVersion(versions)
  if (!original) return null
  return applyContent(id, toVersionRow(original), "reset")
}

// ---------- Saved sections ----------

export type SavedSectionRow = { id: number; name: string; blocks: SectionBlock[]; updatedAt: Date }

export async function listSavedSections(): Promise<SavedSectionRow[]> {
  const rows = await prisma.emailSection.findMany({ orderBy: { updatedAt: "desc" } })
  return rows.map((r) => ({ id: r.id, name: r.name, blocks: r.blocks as unknown as SectionBlock[], updatedAt: r.updatedAt }))
}

export async function createSavedSection(input: { name: string; blocks: SectionBlock[] }): Promise<SavedSectionRow> {
  const r = await prisma.emailSection.create({
    data: { name: input.name, blocks: input.blocks as unknown as object },
  })
  return { id: r.id, name: r.name, blocks: r.blocks as unknown as SectionBlock[], updatedAt: r.updatedAt }
}

export async function renameSavedSection(id: number, name: string): Promise<void> {
  await prisma.emailSection.update({ where: { id }, data: { name } })
}

export async function deleteSavedSection(id: number): Promise<void> {
  await prisma.emailSection.deleteMany({ where: { id } })
}

// ---------- Presets ----------

/** Insert the built-in reply presets once, so Messages starts with usable snippets. */
export async function seedPresets(): Promise<void> {
  const count = await prisma.messagePreset.count()
  if (count > 0) return
  for (const p of SYSTEM_PRESETS) {
    await prisma.messagePreset.create({ data: p })
  }
}

export async function listPresets() {
  await seedPresets()
  return prisma.messagePreset.findMany({ orderBy: { updatedAt: "desc" } })
}
export async function createPreset(input: { name: string; category: string; subject: string; body: string }) {
  return prisma.messagePreset.create({ data: input })
}
export async function updatePreset(
  id: number,
  patch: Partial<{ name: string; category: string; subject: string; body: string }>,
) {
  await prisma.messagePreset.update({ where: { id }, data: patch })
}
export async function deletePreset(id: number) {
  await prisma.messagePreset.delete({ where: { id } })
}

// ---------- Customer messages ----------

export async function listMessages(limit = 100) {
  return prisma.customerMessage.findMany({ orderBy: { createdAt: "desc" }, take: limit })
}
export async function listMessagesFor(email: string) {
  return prisma.customerMessage.findMany({ where: { customerEmail: email }, orderBy: { createdAt: "desc" } })
}
export async function recordMessage(input: {
  customerEmail: string
  customerName?: string
  subject: string
  body: string
  presetId?: number | null
  replyTo?: string
  resendId?: string
  status?: string
}) {
  return prisma.customerMessage.create({
    data: {
      customerEmail: input.customerEmail,
      customerName: input.customerName ?? "",
      subject: input.subject,
      body: input.body,
      presetId: input.presetId ?? null,
      replyTo: input.replyTo ?? "",
      resendId: input.resendId ?? "",
      status: input.status ?? "sent",
    },
  })
}

// ---------- Subscribers ----------

export async function listSubscribers() {
  return prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } })
}
export async function upsertSubscriber(input: { email: string; name?: string; source?: string }) {
  return prisma.subscriber.upsert({
    where: { email: input.email },
    create: { email: input.email, name: input.name ?? "", source: input.source ?? "manual" },
    update: { name: input.name ?? undefined },
  })
}
export async function setSubscriberOptIn(id: number, optedIn: boolean) {
  await prisma.subscriber.update({ where: { id }, data: { optedIn } })
}
export async function deleteSubscriber(id: number) {
  await prisma.subscriber.delete({ where: { id } })
}

// ---------- Campaigns ----------

export type AudienceSpec = { type: "all_subscribers" | "manual"; emails?: string[] }
export type CampaignStats = { recipients?: number; sent?: number; failed?: number; skipped?: number }

export async function listCampaigns() {
  return prisma.campaign.findMany({ orderBy: { updatedAt: "desc" } })
}
export async function getCampaign(id: number) {
  return prisma.campaign.findUnique({ where: { id } })
}
export async function createCampaign(input: {
  name: string
  templateId?: number | null
  subject: string
  previewText: string
  audience: AudienceSpec
}) {
  return prisma.campaign.create({
    data: {
      name: input.name,
      templateId: input.templateId ?? null,
      subject: input.subject,
      previewText: input.previewText,
      audience: input.audience as unknown as object,
      status: "draft",
    },
  })
}
export async function updateCampaign(
  id: number,
  patch: Partial<{
    name: string
    templateId: number | null
    subject: string
    previewText: string
    audience: AudienceSpec
    status: string
    stats: CampaignStats
    sentAt: Date | null
    scheduledAt: Date | null
  }>,
) {
  const data: Record<string, unknown> = { ...patch }
  if (patch.audience) data.audience = patch.audience as unknown as object
  if (patch.stats) data.stats = patch.stats as unknown as object
  await prisma.campaign.update({ where: { id }, data: data as never })
}
export async function deleteCampaign(id: number) {
  await prisma.campaign.delete({ where: { id } })
}

/** Campaigns a cron sweep should send now: scheduled and past their time. */
export async function listDueCampaigns(now: Date = new Date()) {
  return prisma.campaign.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
  })
}

// ---------- Logs / stats ----------

export async function recordLog(input: {
  to: string
  subject: string
  templateKey?: string
  type?: string
  relatedId?: string
  resendId?: string
  status?: string
}) {
  try {
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(input.to) ? input.to.join(", ") : input.to,
        subject: input.subject,
        templateKey: input.templateKey ?? "",
        type: input.type ?? "transactional",
        relatedId: input.relatedId ?? "",
        resendId: input.resendId ?? "",
        status: input.status ?? "sent",
      },
    })
  } catch {
    // Logging must never break a send.
  }
}

export async function getEmailStats() {
  const [total, sent, failed, campaigns, templates, subscribers, recent] = await Promise.all([
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { status: "sent" } }),
    prisma.emailLog.count({ where: { status: "failed" } }),
    prisma.campaign.count(),
    prisma.emailTemplate.count(),
    prisma.subscriber.count({ where: { optedIn: true } }),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ])
  return { total, sent, failed, campaigns, templates, subscribers, recent }
}
