# Environment variables

All variables are read through `lib/env.ts` (`@t3-oss/env-nextjs`), which validates them at build/boot so a misconfiguration fails fast with a clear message instead of surfacing as `undefined` deep in the app. **Import `env` from `@/lib/env` — never read `process.env` directly.**

Every variable is currently `.optional()` because the app runs against local data. Tighten the Strapi ones to required once the CMS is permanent (see [`strapi-migration.md`](strapi-migration.md)).

Empty strings are treated as unset (`emptyStringAsUndefined: true`), so a blank value won't pass a URL check.

---

## Server-only

These are never exposed to the client bundle.

| Variable | Required | Controls |
| --- | --- | --- |
| `STRAPI_API_URL` | When using CMS | **The seam switch.** Presence moves every feature's data access from local data to Strapi. Base URL of the Strapi instance. |
| `STRAPI_API_TOKEN` | When using CMS | Read-only API token sent as `Authorization: Bearer` on every Strapi request. |
| `STRAPI_WEBHOOK_SECRET` | For instant revalidation | Shared secret the Strapi publish webhook sends to `POST /api/revalidate`. If unset, the webhook route is disabled (`501`). Generate with `openssl rand -base64 32`. |
| `STRAPI_REVALIDATE_SECONDS` | No | Background revalidation window (seconds) for CMS fetches. Publish webhooks still invalidate instantly; this is the safety-net refresh interval. |
| `STRAPI_PREVIEW_SECRET` | For editor preview | Shared secret in Strapi preview URLs. `/api/preview` enables draft mode only when the URL's `secret` matches. If unset, `/api/preview` returns `404`. |

## Public (`NEXT_PUBLIC_*`)

Inlined at build time and visible in the browser. Do not put secrets here.

| Variable | Required | Controls |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended in prod | Canonical public origin for metadata, sitemap, robots, OG images, RSS. Falls back to the Vercel production URL, then `localhost` (see `lib/seo/site.ts`). |
| `NEXT_PUBLIC_AUTH_PROVIDER` | No | Selects the auth adapter (see `lib/auth`). |
| `NEXT_PUBLIC_API_URL` | No | Optional external API base. |
| `NEXT_PUBLIC_CONTACT_ENDPOINT` | No | Optional external contact submission endpoint. |
| `NEXT_PUBLIC_REVIEWS_ENDPOINT` | No | Optional external reviews endpoint. |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | No | Dev-only Supabase auth redirect override. Already set in this project. |

---

## Adding a new variable

1. Add it to the correct section (`server` or `client`) in `lib/env.ts` with a zod validator.
2. Add it to the `runtimeEnv` map (client vars must be destructured explicitly — Next.js inlines them at build time and they can't be read dynamically).
3. Document it in this file and add it to `.env.example`.
4. Import it via `env` from `@/lib/env`.
