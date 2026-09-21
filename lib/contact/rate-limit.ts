import "server-only"

/**
 * Minimal fixed-window rate limiter — a deliberate *shape*, not a production
 * backend. It lives in module memory, so it only limits within a single server
 * instance; on serverless it resets on cold start and doesn't share counts
 * across instances. It exists so the contact action is spam-resistant on day
 * one and has a seam to swap for a distributed limiter (e.g. Upstash Ratelimit
 * backed by Redis) without touching the action's logic.
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()
const DEFAULT_MAX = 3
const DEFAULT_WINDOW_MS = 60_000

export function checkRateLimit(
  key: string,
  max = DEFAULT_MAX,
  windowMs = DEFAULT_WINDOW_MS,
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfterMs: 0 }
  }

  if (entry.count >= max) {
    return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count += 1
  return { ok: true, remaining: max - entry.count, retryAfterMs: 0 }
}
