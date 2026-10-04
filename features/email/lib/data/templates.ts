import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_BRANDING,
  type EmailBlock,
  type EmailBranding,
} from "../blocks/types";
import { SYSTEM_TEMPLATES } from "../blocks/system-templates";
import {
  pickOriginalVersion,
  versionIdsToPrune,
  type TemplateContent,
  type VersionReason,
} from "../content/versions";
import type { SectionBlock } from "../content/sections";
import { getStoreSettingsAction } from "@/features/settings";
import { getActiveTheme, resolveTokens } from "@/features/settings";

async function getThemeAccent(): Promise<string> {
  try {
    const settings = await getStoreSettingsAction();
    const theme = getActiveTheme(settings.theme);
    return resolveTokens(theme, "light").accent;
  } catch {
    return DEFAULT_BRANDING.accentColor;
  }
}

export type TemplateRow = {
  id: number;
  key: string;
  name: string;
  category: string;
  subject: string;
  previewText: string;
  description: string;
  blocks: EmailBlock[];
  isSystem: boolean;
  version: number;
  updatedAt: Date;
};

export async function getEmailSettings(): Promise<
  EmailBranding & { id: number }
> {
  const existing = await prisma.emailSettings.findFirst({
    orderBy: { id: "asc" },
  });
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
    }));
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
  };
}

export async function updateEmailSettings(
  patch: Partial<EmailBranding>,
): Promise<void> {
  const current = await getEmailSettings();
  await prisma.emailSettings.update({ where: { id: current.id }, data: patch });
}

export async function getBranding(): Promise<EmailBranding> {
  try {
    const s = await getEmailSettings();
    const merged = { ...DEFAULT_BRANDING, ...s };
    if (!s.accentColor?.trim()) {
      merged.accentColor = await getThemeAccent();
    }
    return merged;
  } catch {
    return DEFAULT_BRANDING;
  }
}

function toTemplateRow(r: {
  id: number;
  key: string;
  name: string;
  category: string;
  subject: string;
  previewText: string;
  description: string;
  blocks: unknown;
  isSystem: boolean;
  version: number;
  updatedAt: Date;
}): TemplateRow {
  return { ...r, blocks: (r.blocks as EmailBlock[]) ?? [] };
}

export async function seedSystemTemplates(): Promise<void> {
  for (const t of SYSTEM_TEMPLATES) {
    const exists = await prisma.emailTemplate.findUnique({
      where: { key: t.key },
    });
    if (exists) continue;
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
    });
  }
}

export async function listTemplates(): Promise<TemplateRow[]> {
  await seedSystemTemplates();
  const rows = await prisma.emailTemplate.findMany({
    orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }],
  });
  return rows.map(toTemplateRow);
}

export async function getTemplate(id: number): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } });
  return r ? toTemplateRow(r) : null;
}

export async function getTemplateBlocksByKey(
  key: string,
): Promise<EmailBlock[] | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { key } });
  return r ? ((r.blocks as unknown as EmailBlock[]) ?? null) : null;
}

export async function createTemplate(input: {
  name: string;
  category: string;
  subject: string;
  previewText: string;
  description: string;
  blocks: EmailBlock[];
}): Promise<TemplateRow> {
  const key = `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
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
  });
  await snapshotTemplate(r, "create");
  return toTemplateRow(r);
}

export async function updateTemplate(
  id: number,
  patch: Partial<{
    name: string;
    category: string;
    subject: string;
    previewText: string;
    description: string;
    blocks: EmailBlock[];
  }>,
): Promise<void> {
  const current = await prisma.emailTemplate.findUnique({ where: { id } });
  if (current) await ensureBaseline(current);
  const data: Record<string, unknown> = { ...patch };
  if (patch.blocks) data.blocks = patch.blocks as unknown as object;
  data.version = { increment: 1 };
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: data as never,
  });
  await snapshotTemplate(updated, "save");
}

export async function deleteTemplate(id: number): Promise<void> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!r || r.isSystem) return;
  await prisma.emailTemplate.delete({ where: { id } });
}

export async function resetSystemTemplate(
  id: number,
): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!r || !r.isSystem) return null;
  const def = SYSTEM_TEMPLATES.find((t) => t.key === r.key);
  if (!def) return null;
  await ensureBaseline(r);
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
  });
  await snapshotTemplate(updated, "reset");
  return toTemplateRow(updated);
}

type SnapshotSource = {
  id: number;
  version: number;
  name: string;
  category: string;
  subject: string;
  previewText: string;
  description: string;
  blocks: unknown;
};

export type TemplateVersionRow = {
  id: number;
  version: number;
  reason: string;
  createdAt: Date;
} & TemplateContent;

async function snapshotTemplate(
  r: SnapshotSource,
  reason: VersionReason,
): Promise<void> {
  const content = {
    name: r.name,
    category: r.category,
    subject: r.subject,
    previewText: r.previewText,
    description: r.description,
    blocks: (r.blocks ?? []) as object,
  };
  await prisma.emailTemplateVersion.upsert({
    where: { templateId_version: { templateId: r.id, version: r.version } },
    create: { templateId: r.id, version: r.version, reason, ...content },
    update: {},
  });
  const all = await prisma.emailTemplateVersion.findMany({
    where: { templateId: r.id },
    select: { id: true, version: true },
  });
  const stale = versionIdsToPrune(all);
  if (stale.length)
    await prisma.emailTemplateVersion.deleteMany({
      where: { id: { in: stale } },
    });
}

async function ensureBaseline(r: SnapshotSource): Promise<void> {
  const count = await prisma.emailTemplateVersion.count({
    where: { templateId: r.id },
  });
  if (count === 0) await snapshotTemplate(r, "baseline");
}

function toVersionRow(v: {
  id: number;
  version: number;
  reason: string;
  createdAt: Date;
  name: string;
  category: string;
  subject: string;
  previewText: string;
  description: string;
  blocks: unknown;
}): TemplateVersionRow {
  return { ...v, blocks: (v.blocks as EmailBlock[]) ?? [] };
}

export async function listTemplateVersions(
  templateId: number,
): Promise<TemplateVersionRow[]> {
  const r = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });
  if (!r) return [];
  await ensureBaseline(r);
  const rows = await prisma.emailTemplateVersion.findMany({
    where: { templateId },
    orderBy: { version: "desc" },
  });
  return rows.map(toVersionRow);
}

async function applyContent(
  id: number,
  content: TemplateContent,
  reason: VersionReason,
): Promise<TemplateRow> {
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
  });
  await snapshotTemplate(updated, reason);
  return toTemplateRow(updated);
}

export async function restoreTemplateVersion(
  templateId: number,
  versionId: number,
): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });
  if (!r) return null;
  const v = await prisma.emailTemplateVersion.findUnique({
    where: { id: versionId },
  });
  if (!v || v.templateId !== templateId) return null;
  await ensureBaseline(r);
  return applyContent(templateId, toVersionRow(v), "restore");
}

export async function resetCustomTemplate(
  id: number,
): Promise<TemplateRow | null> {
  const r = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!r || r.isSystem) return null;
  await ensureBaseline(r);
  const versions = await prisma.emailTemplateVersion.findMany({
    where: { templateId: id },
  });
  const original = pickOriginalVersion(versions);
  if (!original) return null;
  return applyContent(id, toVersionRow(original), "reset");
}

export type SavedSectionRow = {
  id: number;
  name: string;
  blocks: SectionBlock[];
  updatedAt: Date;
};

export async function listSavedSections(): Promise<SavedSectionRow[]> {
  const rows = await prisma.emailSection.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    blocks: r.blocks as unknown as SectionBlock[],
    updatedAt: r.updatedAt,
  }));
}

export async function createSavedSection(input: {
  name: string;
  blocks: SectionBlock[];
}): Promise<SavedSectionRow> {
  const r = await prisma.emailSection.create({
    data: { name: input.name, blocks: input.blocks as unknown as object },
  });
  return {
    id: r.id,
    name: r.name,
    blocks: r.blocks as unknown as SectionBlock[],
    updatedAt: r.updatedAt,
  };
}

export async function renameSavedSection(
  id: number,
  name: string,
): Promise<void> {
  await prisma.emailSection.update({ where: { id }, data: { name } });
}

export async function deleteSavedSection(id: number): Promise<void> {
  await prisma.emailSection.deleteMany({ where: { id } });
}
