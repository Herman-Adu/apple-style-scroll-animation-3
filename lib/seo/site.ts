import { env } from "@/lib/env"

/**
 * Canonical origin resolution for all SEO surfaces (metadata, sitemap, robots,
 * OG images, RSS, structured data). One source of truth so links never drift
 * between environments.
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL — set this in production for a stable canonical.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — automatic on Vercel deployments.
 *   3. localhost — local dev fallback.
 */
export function getBaseUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}

/**
 * Resolve a path (or already-absolute URL) to an absolute URL against the
 * canonical origin. Passes through values that are already absolute so CMS
 * media URLs from Strapi are never double-prefixed.
 */
export function absoluteUrl(path = ""): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = getBaseUrl()
  if (!path) return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}
