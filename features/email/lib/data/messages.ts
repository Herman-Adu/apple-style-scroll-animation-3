import "server-only";

import { prisma } from "@/lib/db/prisma";
import { SYSTEM_PRESETS } from "../blocks/system-templates";

export async function seedPresets(): Promise<void> {
  const count = await prisma.messagePreset.count();
  if (count > 0) return;
  for (const p of SYSTEM_PRESETS) {
    await prisma.messagePreset.create({ data: p });
  }
}

export async function listPresets() {
  await seedPresets();
  return prisma.messagePreset.findMany({ orderBy: { updatedAt: "desc" } });
}
export async function createPreset(input: {
  name: string;
  category: string;
  subject: string;
  body: string;
}) {
  return prisma.messagePreset.create({ data: input });
}
export async function updatePreset(
  id: number,
  patch: Partial<{
    name: string;
    category: string;
    subject: string;
    body: string;
  }>,
) {
  await prisma.messagePreset.update({ where: { id }, data: patch });
}
export async function deletePreset(id: number) {
  await prisma.messagePreset.delete({ where: { id } });
}

export async function listMessages(limit = 100) {
  return prisma.customerMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
export async function listMessagesFor(email: string) {
  return prisma.customerMessage.findMany({
    where: { customerEmail: email },
    orderBy: { createdAt: "desc" },
  });
}
export async function recordMessage(input: {
  customerEmail: string;
  customerName?: string;
  subject: string;
  body: string;
  presetId?: number | null;
  replyTo?: string;
  resendId?: string;
  status?: string;
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
  });
}

export async function listSubscribers() {
  return prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
}
export async function upsertSubscriber(input: {
  email: string;
  name?: string;
  source?: string;
}) {
  return prisma.subscriber.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      name: input.name ?? "",
      source: input.source ?? "manual",
    },
    update: { name: input.name ?? undefined },
  });
}
export async function setSubscriberOptIn(id: number, optedIn: boolean) {
  await prisma.subscriber.update({ where: { id }, data: { optedIn } });
}
export async function deleteSubscriber(id: number) {
  await prisma.subscriber.delete({ where: { id } });
}

export type AudienceSpec = {
  type: "all_subscribers" | "manual";
  emails?: string[];
};
export type CampaignStats = {
  recipients?: number;
  sent?: number;
  failed?: number;
  skipped?: number;
};

export async function listCampaigns() {
  return prisma.campaign.findMany({ orderBy: { updatedAt: "desc" } });
}
export async function getCampaign(id: number) {
  return prisma.campaign.findUnique({ where: { id } });
}
export async function createCampaign(input: {
  name: string;
  templateId?: number | null;
  subject: string;
  previewText: string;
  audience: AudienceSpec;
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
  });
}
export async function updateCampaign(
  id: number,
  patch: Partial<{
    name: string;
    templateId: number | null;
    subject: string;
    previewText: string;
    audience: AudienceSpec;
    status: string;
    stats: CampaignStats;
    sentAt: Date | null;
    scheduledAt: Date | null;
  }>,
) {
  const data: Record<string, unknown> = { ...patch };
  if (patch.audience) data.audience = patch.audience as unknown as object;
  if (patch.stats) data.stats = patch.stats as unknown as object;
  await prisma.campaign.update({ where: { id }, data: data as never });
}
export async function deleteCampaign(id: number) {
  await prisma.campaign.delete({ where: { id } });
}

export async function listDueCampaigns(now: Date = new Date()) {
  return prisma.campaign.findMany({
    where: { status: "scheduled", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
  });
}

export async function recordLog(input: {
  to: string;
  subject: string;
  templateKey?: string;
  type?: string;
  relatedId?: string;
  resendId?: string;
  status?: string;
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
    });
  } catch {
    // Logging must never break a send.
  }
}

export async function getEmailStats() {
  const [total, sent, failed, campaigns, templates, subscribers, recent] =
    await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: "sent" } }),
      prisma.emailLog.count({ where: { status: "failed" } }),
      prisma.campaign.count(),
      prisma.emailTemplate.count(),
      prisma.subscriber.count({ where: { optedIn: true } }),
      prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
  return { total, sent, failed, campaigns, templates, subscribers, recent };
}
