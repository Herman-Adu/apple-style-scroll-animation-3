import "server-only"

import { env } from "@/lib/env"

/**
 * The single hardened transport for every Strapi read.
 *
 * Responsibilities kept here (so no feature has to reinvent them):
 *  - build the URL + attach the API token
 *  - time out slow requests (AbortSignal) instead of hanging a render
 *  - retry transient network / 5xx failures with backoff
 *  - unwrap Strapi's `{ data, meta }` envelope
 *  - attach cache tags for `revalidateTag`-based invalidation
 *
 * Validation is intentionally *not* here — the caller passes `parse`, which
 * runs the feature's zod schema (via its mapper) over the unwrapped `data`.
 * That keeps transport generic and the domain contract inside each feature.
 *
 * Throwing on failure is deliberate: the app's error/not-found boundaries
 * already catch it and render the fallback UI.
 */
export class StrapiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "StrapiError"
    this.status = status
  }
}

type FetchStrapiOptions<T> = {
  /** Validate + shape the unwrapped `data` (usually `schema.parse(map(data))`). */
  parse: (data: unknown) => T
  /** Cache tags for on-publish revalidation. */
  tags?: string[]
  /** Background revalidation window in seconds. */
  revalidate?: number
  timeoutMs?: number
  retries?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const isAbort = (err: unknown) => err instanceof Error && err.name === "AbortError"

export async function fetchStrapi<T>(path: string, options: FetchStrapiOptions<T>): Promise<T> {
  const { parse, tags = [], revalidate, timeoutMs = 8000, retries = 2 } = options

  if (!env.STRAPI_API_URL) {
    throw new StrapiError("STRAPI_API_URL is not configured")
  }

  const url = new URL(path, env.STRAPI_API_URL).toString()
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${env.STRAPI_API_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
        next: {
          tags,
          ...(revalidate !== undefined ? { revalidate } : {}),
        },
      })

      if (!res.ok) {
        // Retry server errors; fail fast on client errors (bad token, 404, etc.).
        if (res.status >= 500 && attempt < retries) {
          lastError = new StrapiError(`Strapi responded ${res.status}`, res.status)
          await sleep(2 ** attempt * 250)
          continue
        }
        throw new StrapiError(`Strapi request failed (${res.status}) for ${path}`, res.status)
      }

      const json = (await res.json()) as { data?: unknown }
      // Collection + single-entry endpoints both nest the payload under `data`.
      return parse(json?.data ?? json)
    } catch (err) {
      lastError = err
      const retryable = isAbort(err) || err instanceof TypeError // network/timeout
      if (retryable && attempt < retries) {
        await sleep(2 ** attempt * 250)
        continue
      }
      if (err instanceof StrapiError) throw err
      throw new StrapiError(isAbort(err) ? `Strapi request timed out for ${path}` : String(err))
    }
  }

  throw lastError instanceof Error ? lastError : new StrapiError(`Strapi request failed for ${path}`)
}

/** Normalize `data` into an array for collection endpoints. */
export function toEntries(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data == null) return []
  return [data]
}
