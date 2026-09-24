import "server-only"

/**
 * Dependency-free Resend transport. Calls the Resend REST API directly via
 * fetch so there is no SDK to install or keep in sync. Reads RESEND_API_KEY
 * from the environment — when it is absent (e.g. before the key is added) every
 * send becomes a logged no-op so nothing throws in development or at checkout.
 *
 * EMAIL_FROM controls the sender. It must be an address on a domain verified in
 * your Resend account for real delivery; it falls back to Resend's shared
 * onboarding sender, which only delivers to your own account address.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails"
const DEFAULT_FROM = "MOMO Audio <onboarding@resend.dev>"

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export type SendEmailResult =
  | { ok: true; id: string; skipped?: false }
  | { ok: true; id: null; skipped: true; reason: string }
  | { ok: false; error: string }

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/**
 * Resolve the sender safely. EMAIL_FROM must be an email address, optionally in
 * `Name <addr@domain>` form. If it is missing OR malformed (a common misconfig
 * is pasting a Resend `re_` API key into this slot), fall back to the verified
 * onboarding sender so a bad value can never break delivery — Resend rejects a
 * non-address `from`, which would otherwise fail every send silently.
 */
function resolveFrom(): string {
  const raw = process.env.EMAIL_FROM?.trim()
  if (!raw) return DEFAULT_FROM
  if (!raw.includes("@")) {
    console.log(
      "[v0] EMAIL_FROM is not a valid sender address (no '@'); using onboarding default. " +
        "Set EMAIL_FROM to an address on a domain verified in Resend.",
    )
    return DEFAULT_FROM
  }
  return raw
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = resolveFrom()

  if (!apiKey) {
    console.log("[v0] Email skipped (RESEND_API_KEY not set):", input.subject, "->", input.to)
    return { ok: true, id: null, skipped: true, reason: "RESEND_API_KEY not set" }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.log("[v0] Resend send failed:", res.status, detail)
      return { ok: false, error: `Resend responded ${res.status}` }
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: data.id ?? "" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error"
    console.log("[v0] Resend send error:", message)
    return { ok: false, error: message }
  }
}
