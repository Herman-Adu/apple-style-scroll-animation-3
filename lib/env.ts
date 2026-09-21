import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

/**
 * Type-safe, validated environment access.
 *
 * Import `env` instead of reading `process.env` directly so misconfigured or
 * missing variables fail fast (at build/boot) with a clear message rather than
 * surfacing as `undefined` deep in the app.
 *
 * Everything here is currently `.optional()` because the app runs against local
 * data. When the Strapi headless CMS instance is connected, tighten
 * `STRAPI_API_URL` / `STRAPI_API_TOKEN` to required and the feature `api`
 * layers will read them from here.
 */
export const env = createEnv({
  server: {
    // Strapi headless CMS — wired in once the instance exists.
    STRAPI_API_URL: z.string().url().optional(),
    STRAPI_API_TOKEN: z.string().min(1).optional(),
    // Shared secret Strapi sends with publish webhooks so /api/revalidate can
    // trust the request before invalidating cache tags.
    STRAPI_WEBHOOK_SECRET: z.string().min(1).optional(),
    // Background revalidation window (seconds) for CMS fetches. Publish webhooks
    // still invalidate instantly; this is the safety-net refresh interval.
    STRAPI_REVALIDATE_SECONDS: z.coerce.number().int().positive().optional(),
    // Shared secret in Strapi preview URLs. /api/preview enables Next draft mode
    // only when the URL's `secret` matches this. Unset = preview disabled.
    STRAPI_PREVIEW_SECRET: z.string().min(1).optional(),
  },
  client: {
    // Canonical public origin used for metadata, sitemap, robots, OG images and
    // RSS. Falls back to the Vercel production URL, then localhost (see lib/seo/site).
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
    NEXT_PUBLIC_AUTH_PROVIDER: z.string().optional(),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_CONTACT_ENDPOINT: z.string().url().optional(),
    NEXT_PUBLIC_REVIEWS_ENDPOINT: z.string().url().optional(),
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),
  },
  /**
   * Next.js inlines `NEXT_PUBLIC_*` at build time, so each client var must be
   * destructured explicitly here (it can't be read dynamically).
   */
  runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    STRAPI_API_URL: process.env.STRAPI_API_URL,
    STRAPI_API_TOKEN: process.env.STRAPI_API_TOKEN,
    STRAPI_WEBHOOK_SECRET: process.env.STRAPI_WEBHOOK_SECRET,
    STRAPI_REVALIDATE_SECONDS: process.env.STRAPI_REVALIDATE_SECONDS,
    STRAPI_PREVIEW_SECRET: process.env.STRAPI_PREVIEW_SECRET,
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_CONTACT_ENDPOINT: process.env.NEXT_PUBLIC_CONTACT_ENDPOINT,
    NEXT_PUBLIC_REVIEWS_ENDPOINT: process.env.NEXT_PUBLIC_REVIEWS_ENDPOINT,
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
  },
  /** Treat empty strings as "unset" so blank values don't pass URL checks. */
  emptyStringAsUndefined: true,
})
