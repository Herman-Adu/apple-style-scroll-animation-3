import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

import { env } from "@/lib/env"
import { tagsForModel } from "@/lib/strapi/tags"

/**
 * Strapi publish webhook -> tag-based cache invalidation.
 *
 * Configure a Strapi webhook (Settings -> Webhooks) pointing at
 * `POST /api/revalidate` with an `Authorization: Bearer <STRAPI_WEBHOOK_SECRET>`
 * header on the `entry.publish` / `entry.update` / `entry.unpublish` events.
 * On each publish, only the affected cache tags are invalidated, so the matching
 * pages refresh instantly without a redeploy.
 *
 * Strapi payload shape: `{ event, model, entry }` — `model` is the singular
 * content-type name (e.g. "product"), `entry` the record (we read `slug`).
 */
export async function POST(request: Request) {
  if (!env.STRAPI_WEBHOOK_SECRET) {
    return NextResponse.json(
      { revalidated: false, message: "Revalidation webhook is not configured" },
      { status: 501 },
    )
  }

  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("secret")

  if (provided !== env.STRAPI_WEBHOOK_SECRET) {
    return NextResponse.json({ revalidated: false, message: "Invalid secret" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { model?: string; entry?: { slug?: string } }
    | null

  if (!payload?.model) {
    return NextResponse.json({ revalidated: false, message: "Missing model" }, { status: 400 })
  }

  const tags = tagsForModel(payload.model, payload.entry?.slug)
  if (tags.length === 0) {
    return NextResponse.json(
      { revalidated: false, message: `No cache tags mapped for model "${payload.model}"` },
      { status: 200 },
    )
  }

  // Next.js 16: revalidateTag takes a cacheLife profile as the second arg so the
  // stale entry is served while the fresh one is fetched (stale-while-revalidate).
  for (const tag of tags) {
    revalidateTag(tag, "max")
  }

  return NextResponse.json({ revalidated: true, tags, now: Date.now() })
}
