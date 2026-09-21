import { draftMode } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { env } from "@/lib/env"

/**
 * Draft-mode entry point for CMS previews.
 *
 * Strapi's preview button will link editors here with `?secret=...&redirect=/path`.
 * We enable Next.js draft mode only when the secret matches, so the feature
 * `api` layers can fetch unpublished content for this session. The whole route
 * is inert until `STRAPI_PREVIEW_SECRET` is set — before the CMS exists it
 * simply 404s, so it ships safely today.
 */
export async function GET(request: NextRequest) {
  const secret = env.STRAPI_PREVIEW_SECRET

  // Preview not configured yet (no Strapi). Behave as if the route doesn't exist.
  if (!secret) {
    return new Response("Preview mode is not enabled.", { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  if (searchParams.get("secret") !== secret) {
    return new Response("Invalid preview token.", { status: 401 })
  }

  // Only allow same-site relative redirects to avoid an open-redirect.
  const requested = searchParams.get("redirect") || "/"
  const target = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/"

  const draft = await draftMode()
  draft.enable()

  redirect(target)
}
