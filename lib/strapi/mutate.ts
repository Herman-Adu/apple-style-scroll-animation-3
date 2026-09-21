import "server-only"

import { revalidateTag } from "next/cache"
import { env } from "@/lib/env"
import { StrapiError } from "./client"

/**
 * The write counterpart to `fetchStrapi`. Every Strapi create/update/delete
 * flows through here so the concerns that must never be forgotten on a write
 * live in exactly one place:
 *
 *  - attach the API token + JSON headers
 *  - wrap the body in Strapi's `{ data }` envelope
 *  - time out slow requests instead of hanging a Server Action
 *  - unwrap the `{ data, meta }` response
 *  - bust the affected cache tags via `revalidateTag` after a successful write
 *
 * Reads are cached and tag-invalidated; writes are the invalidation *source*.
 * Keeping both halves adjacent (fetch + mutate) is what makes the eventual
 * Strapi swap a drop-in: features already speak "mutate then revalidate".
 *
 * Validation stays with the caller (pass `parse`) exactly like `fetchStrapi`.
 */

type Method = "POST" | "PUT" | "DELETE"

type MutateStrapiOptions<T> = {
  method: Method
  /** JSON body; wrapped as `{ data: body }` per Strapi's convention. */
  body?: unknown
  /** Validate + shape the unwrapped response `data`. */
  parse?: (data: unknown) => T
  /** Cache tags to revalidate after the write succeeds. */
  revalidateTags?: string[]
  timeoutMs?: number
}

export async function mutateStrapi<T = unknown>(path: string, options: MutateStrapiOptions<T>): Promise<T> {
  const { method, body, parse, revalidateTags = [], timeoutMs = 8000 } = options

  if (!env.STRAPI_API_URL) {
    throw new StrapiError("STRAPI_API_URL is not configured")
  }
  if (!env.STRAPI_API_TOKEN) {
    // Writes always require auth — fail loudly rather than silently 403.
    throw new StrapiError("STRAPI_API_TOKEN is required for write operations")
  }

  const url = new URL(path, env.STRAPI_API_URL).toString()

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.STRAPI_API_TOKEN}`,
      },
      body: body !== undefined ? JSON.stringify({ data: body }) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError"
    throw new StrapiError(timedOut ? `Strapi write timed out for ${path}` : String(err))
  }

  if (!res.ok) {
    throw new StrapiError(`Strapi ${method} failed (${res.status}) for ${path}`, res.status)
  }

  // Bust caches only after the write is known to have succeeded.
  for (const tag of revalidateTags) {
    revalidateTag(tag)
  }

  if (method === "DELETE" || !parse) {
    return undefined as T
  }

  const json = (await res.json()) as { data?: unknown }
  return parse(json?.data ?? json)
}
