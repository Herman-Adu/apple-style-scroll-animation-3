import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

/**
 * Leaves draft mode and returns to the published site. Safe to call anytime —
 * disabling draft mode when it's already off is a no-op.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get("redirect") || "/"
  const target = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/"

  const draft = await draftMode()
  draft.disable()

  redirect(target)
}
