import { NextResponse } from "next/server"

import { listDueCampaigns } from "@/features/email/repo"
import { sendCampaign } from "@/features/email/campaign-send"

/**
 * Scheduled-send sweep for campaigns whose `scheduledAt` has passed. Not
 * currently wired up to Vercel Cron (no entry in `vercel.json`) — the Hobby
 * plan only allows once-daily cron runs, which isn't fine-grained enough for
 * this use case, and Pro isn't worth it yet for this project. Campaigns are
 * sent manually ("Send now") for the time being.
 *
 * To re-enable: add a `crons` entry to `vercel.json` pointing at this route,
 * set `CRON_SECRET`, and Vercel will call it on schedule. The 501 response
 * below is what keeps it harmless if ever hit without that secret configured.
 *
 * Kept idempotent-ish: each due campaign is picked up once per run and
 * `sendCampaign` immediately flips its status away from "scheduled"
 * (to "sending" then "sent"), so a slow send can't be double-picked by an
 * overlapping invocation.
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
    const result = await sendCampaign(campaign.id)
    results.push({ id: campaign.id, name: campaign.name, ...result })
  }

  return NextResponse.json({ ok: true, checked: due.length, results })
}
