import type { Metadata } from "next"
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

/**
 * Metadata for one indexable page: its own canonical and its own card titles.
 *
 * A page that leaves these out silently inherits the root layout's, which is a
 * quiet fault rather than a loud one — every docs page once declared the home
 * page as canonical and carried the site-wide `twitter:title`, so links posted
 * to X previewed as the store name. `qa/seo/seo-surfaces.spec.ts` checks a
 * sample of page types; using this helper is how a new page passes it.
 *
 * `title` is the bare page title. The root layout's `%s | <site>` template adds
 * the suffix for `<title>`, while the cards keep the unsuffixed form.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string
  description: string
  /** Root-relative, e.g. `/docs/engineering-quality`. */
  path: string
  type?: "website" | "article"
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type, title, description, url: absoluteUrl(path) },
    twitter: { card: "summary_large_image", title, description },
  }
}
