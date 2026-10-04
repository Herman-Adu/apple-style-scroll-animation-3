import "server-only"

import { env } from "@/lib/env"
import { sendEmail } from "@/features/email/server"
import { recordMessage, recordLog } from "@/features/email/server"
import type { ContactSubmitResult, EnquiryPayload } from "../domain/types"

/**
 * Transport layer for contact enquiries.
 *
 * Default path (no NEXT_PUBLIC_CONTACT_ENDPOINT set): the enquiry is recorded
 * as a customer message — keyed by the sender's email, which is how it links to
 * a customer account in the admin — and a notification email is delivered to
 * EMAIL_TO via Resend with reply-to set to the customer, so a reply goes
 * straight back to them. If EMAIL_TO / NEXT_PUBLIC_CONTACT_ENDPOINT point at a
 * custom REST backend (e.g. Strapi), that takes precedence and receives the raw
 * payload instead.
 */
const endpoint = env.NEXT_PUBLIC_CONTACT_ENDPOINT

function makeReference(): string {
  return `MOMO-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** camelCase / snake_case field keys → readable labels for the summary. */
function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

type Row = { label: string; value: string }

/** Fixed header rows plus one row per submitted dynamic field (blank skipped). */
function buildRows(payload: EnquiryPayload): Row[] {
  const rows: Row[] = [
    { label: "Topic", value: payload.typeLabel },
    { label: "Name", value: payload.name },
    { label: "Email", value: payload.email },
  ]
  for (const [key, val] of Object.entries(payload.fields)) {
    if (val === undefined || val === null || String(val).trim() === "") continue
    rows.push({ label: humanizeKey(key), value: String(val) })
  }
  return rows
}

function renderHtml(payload: EnquiryPayload, reference: string): string {
  const rows = buildRows(payload)
    .map(
      (r) =>
        `<tr>` +
        `<td style="padding:8px 12px;color:#6b7280;font:500 12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;white-space:nowrap;">${escapeHtml(
          r.label,
        )}</td>` +
        `<td style="padding:8px 12px;color:#111827;font:400 14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;">${escapeHtml(
          r.value,
        ).replace(/\n/g, "<br>")}</td>` +
        `</tr>`,
    )
    .join("")

  return `<div style="background:#f4f4f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;border-bottom:1px solid #e4e4e7;">
      <p style="margin:0;font:600 15px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">New enquiry &middot; ${escapeHtml(
        payload.typeLabel,
      )}</p>
      <p style="margin:4px 0 0;font:400 12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#9ca3af;">Ref ${escapeHtml(
        reference,
      )} &middot; ${escapeHtml(new Date(payload.submittedAt).toUTCString())}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <div style="padding:16px 24px;border-top:1px solid #e4e4e7;">
      <a href="mailto:${escapeHtml(payload.email)}" style="font:600 13px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:#2563eb;text-decoration:none;">Reply to ${escapeHtml(
        payload.name,
      )} &rarr;</a>
    </div>
  </div>
</div>`
}

function renderText(payload: EnquiryPayload, reference: string): string {
  const lines = buildRows(payload).map((r) => `${r.label}: ${r.value}`)
  return `New enquiry — ${payload.typeLabel}\nRef ${reference}\n\n${lines.join("\n")}\n`
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<ContactSubmitResult> {
  const reference = makeReference()

  // Custom REST backend takes precedence when explicitly configured.
  if (endpoint) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Strapi's REST convention wraps the record in `data`; harmless for other backends.
      body: JSON.stringify({ data: { ...payload, reference } }),
    })
    if (!res.ok) {
      throw new Error("We couldn't send your message. Please try again.")
    }
    const body = (await res.json().catch(() => null)) as { reference?: string } | null
    return { ok: true, reference: body?.reference ?? reference }
  }

  // Record the enquiry first so it is captured in the admin inbox and linked to
  // the customer's account by email — even if the outbound notify later fails.
  const detailBody = buildRows(payload)
    .filter((r) => !["Topic", "Name", "Email"].includes(r.label))
    .map((r) => `${r.label}: ${r.value}`)
    .join("\n")
  try {
    await recordMessage({
      customerEmail: payload.email.toLowerCase(),
      customerName: payload.name,
      subject: `${payload.typeLabel} — ${reference}`,
      body: detailBody || payload.typeLabel,
      replyTo: payload.email,
      status: "received",
    })
  } catch {
    // Persistence must never block the enquiry from being sent.
  }

  const to = process.env.EMAIL_TO || process.env.EMAIL_FROM
  if (!to) {
    // No destination inbox configured; the record above still captured it.
    return { ok: true, reference }
  }

  const subject = `New enquiry · ${payload.typeLabel} · ${payload.name}`
  const sent = await sendEmail({
    to,
    subject,
    html: renderHtml(payload, reference),
    text: renderText(payload, reference),
    replyTo: payload.email,
  })

  await recordLog({
    to,
    subject,
    type: "transactional",
    relatedId: reference,
    resendId: sent.ok && sent.id ? sent.id : "",
    status: sent.ok ? (sent.skipped ? "skipped" : "sent") : "failed",
  })

  if (!sent.ok) {
    throw new Error("We couldn't send your message. Please try again.")
  }

  return { ok: true, reference }
}
