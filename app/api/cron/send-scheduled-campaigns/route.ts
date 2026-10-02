import { NextResponse } from "next/server"

import { listDueCampaigns } from "@/features/email/repo"
import { sendCampaignAction } from "@/features/email/admin-actions"

/**
 * Vercel Cron entry point (see `vercel.json`) that sweeps for campaigns whose
 * `scheduledAt` has passed and sends them. Kept idempotent-ish: each due
 * campaign is picked up once per run and `sendCampaignAction` immediately
 * flips its status away from "scheduled" (to "sending" then "sent"), so a
 * slow send can't be double-picked by an overlapping invocation.
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Scheduled sending is not configured" }, { status: 501 })
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 })
  }

  const due = await listDueCampaigns()
  const results = []
  for (const campaign of due) {
    const result = await sendCampaignAction(campaign.id)
    results.push({ id: campaign.id, name: campaign.name, ...result })
  }

  return NextResponse.json({ ok: true, checked: due.length, results })
}
