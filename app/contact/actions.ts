"use server"

import { headers } from "next/headers"
import { enquiryTypes } from "@/lib/data/contact"
import { enquiryInputSchema } from "@/lib/contact/schema"
import { checkRateLimit } from "@/lib/contact/rate-limit"
import { submitEnquiry } from "@/lib/contact/submit"
import { getServerSession } from "@/lib/auth/server"
import type { ContactActionResult } from "@/lib/contact/types"

/**
 * Server action for contact enquiries. This is the trust boundary: it
 * re-validates everything with zod (the client's inline checks are only UX),
 * silently drops honeypot hits, applies a basic per-IP+email rate limit, then
 * hands the clean payload to the transport. Runs on the server, so the
 * endpoint and any secret never reach the client bundle.
 */
export async function submitEnquiryAction(raw: unknown): Promise<ContactActionResult> {
  const parsed = enquiryInputSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors as ContactActionResult["fieldErrors"],
    }
  }

  const input = parsed.data

  // Honeypot tripped: respond as if it succeeded so bots get no signal, but
  // never actually send anything downstream. Logged (not silent) because a
  // false positive here — e.g. browser autofill filling the hidden field —
  // would otherwise make a genuine enquiry vanish with no trace.
  if (input.website && input.website.trim().length > 0) {
    console.log(
      "[v0] Contact honeypot tripped — dropping submission. If this was a real user, their browser likely autofilled the hidden field.",
      { type: input.type, email: input.email },
    )
    return { ok: true, reference: "MOMO-RECEIVED" }
  }

  // Basic abuse throttle. Keyed by client IP + email so a single origin can't
  // hammer the form. Swap `checkRateLimit` for a distributed limiter in prod.
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limit = checkRateLimit(`contact:${ip}:${input.email.toLowerCase()}`)
  if (!limit.ok) {
    const seconds = Math.ceil(limit.retryAfterMs / 1000)
    return {
      ok: false,
      error: `You're sending messages too quickly. Please wait ${seconds}s and try again.`,
    }
  }

  // Derive the label server-side rather than trusting the client.
  const type = enquiryTypes.find((t) => t.id === input.type)
  if (!type) {
    return { ok: false, error: "Unknown enquiry type.", fieldErrors: { type: ["Unknown enquiry type."] } }
  }

  // Account-gated topics (e.g. product support, reviews) require a valid
  // session. This is the trust boundary — the client also hides these behind a
  // sign-in prompt, but that is only UX and can be bypassed.
  if (type.access === "account") {
    const session = await getServerSession()
    if (!session) {
      return {
        ok: false,
        error: `Please sign in to submit a ${type.label.toLowerCase()}.`,
      }
    }
  }

  try {
    const res = await submitEnquiry({
      type: input.type,
      typeLabel: type.label,
      name: input.name,
      email: input.email,
      fields: input.fields,
      submittedAt: new Date().toISOString(),
    })
    return { ok: true, reference: res.reference }
  } catch {
    return { ok: false, error: "We couldn't send your message. Please try again." }
  }
}
