import { env } from "@/lib/env"
import type { ContactSubmitResult, EnquiryPayload } from "./types"

// Transport layer. Point NEXT_PUBLIC_CONTACT_ENDPOINT at any REST backend
// (Strapi, a route handler, a form service) to receive real submissions.
// Without it, submissions resolve locally so the flow works in preview.
const endpoint = env.NEXT_PUBLIC_CONTACT_ENDPOINT

function makeReference(): string {
  return `MOMO-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

export async function submitEnquiry(payload: EnquiryPayload): Promise<ContactSubmitResult> {
  const reference = makeReference()

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

  await new Promise((resolve) => setTimeout(resolve, 700))
  return { ok: true, reference }
}
