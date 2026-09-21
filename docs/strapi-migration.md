# Strapi migration runbook

The app is built to switch from local in-repo data to a Strapi CMS by setting environment variables. This document is the step-by-step go-live procedure.

> **The one switch:** setting `STRAPI_API_URL` flips every feature's data access from local data to Strapi. Everything else below supports that switch (auth token, webhook, preview).

---

## How the seam works (why this is low-risk)

Each feature's `api/index.ts` returns the same validated domain types regardless of source. Local data and Strapi data both pass through the same zod schema. So pages, static params, and Suspense boundaries are untouched by the migration. The only code that is Strapi-aware:

- `lib/strapi/client.ts` — the transport (already built and unit-tested).
- `lib/strapi/tags.ts` — cache-tag taxonomy (already built).
- `lib/strapi/media.ts` — media URL normalization (already built).
- `features/*/mappers.ts` — CMS-field-name -> domain-shape mapping (already built; field names may need adjustment to match your content-types).

---

## Prerequisites

1. A running Strapi instance (Cloud or self-hosted).
2. Content-types created in Strapi that match the domain contracts. The mappers currently assume these singular model names and fields:
   - **`product`** — `slug`, `name`, `tagline`, `category`, `price` (`amount`, `currency`), `summary`, `description`, `image`, `accent`, `featured`, `releaseStatus`, `hero` (polymorphic: `parallax` | `exploded` | `frames`), `features[]`, `specs[]`, `colors[]`
   - **`article`** — see `features/articles/mappers.ts` and `features/articles/schema`
   - **`milestone`** (timeline) — see `features/timeline/mappers.ts` and `features/timeline/schema`
3. A read-only **API token** (Strapi: Settings → API Tokens).

---

## Go-live steps

### 1. Set environment variables

In the Vercel project (or `.env.local` for local testing):

```bash
STRAPI_API_URL=https://your-strapi-instance.com
STRAPI_API_TOKEN=<read-only api token>
STRAPI_REVALIDATE_SECONDS=3600
STRAPI_WEBHOOK_SECRET=<openssl rand -base64 32>
STRAPI_PREVIEW_SECRET=<openssl rand -base64 32>   # optional, for editor previews
```

As soon as `STRAPI_API_URL` is present, the `useStrapi` branch activates in every feature `api` module.

### 2. Verify the mappers match your content-types

Open each `features/*/mappers.ts`. The **left-hand** keys are the domain contract (do not change them). Adjust the **right-hand** side only if your Strapi field names differ. If a content-type drifts from the schema, the zod parse throws at the boundary with a clear error — which is the intended fail-loud behavior, not a silent `undefined`.

### 3. Wire the publish webhook (instant revalidation)

In Strapi: **Settings → Webhooks → Create**:

- **URL:** `https://<your-site>/api/revalidate`
- **Header:** `Authorization: Bearer <STRAPI_WEBHOOK_SECRET>`
- **Events:** `entry.publish`, `entry.update`, `entry.unpublish`

The route maps the payload's `model` (e.g. `product`) to cache tags via `tagsForModel()` and calls `revalidateTag` for each. Only affected pages refresh — no redeploy. If the secret is unset, the route returns `501` (safely disabled).

Expected payload shape: `{ event, model, entry }` where `model` is the singular content-type name and `entry` contains at least `slug`.

### 4. Enable editor preview (optional)

With `STRAPI_PREVIEW_SECRET` set, configure Strapi's preview button to open:

```
https://<your-site>/api/preview?secret=<STRAPI_PREVIEW_SECRET>&redirect=/products/<slug>
```

`/api/preview` validates the secret, enables Next.js draft mode, and redirects (relative paths only, to prevent open redirects). `/api/exit-preview` leaves draft mode. Until the secret is set, `/api/preview` returns `404`.

> To actually serve unpublished content in draft mode, extend the feature `api` layer to check `draftMode().isEnabled` and add Strapi's `publicationState=preview` (v4) / `status=draft` (v5) to the query. The routes and secret plumbing are already in place.

### 5. Tighten security headers

In `next.config.mjs`, add your Strapi origin to the CSP `connect-src` list, then promote the CSP from `Content-Security-Policy-Report-Only` to the enforcing `Content-Security-Policy` once you've confirmed no violations in the browser console.

### 6. Lock down env validation (optional but recommended)

In `lib/env.ts`, once Strapi is permanent, change `STRAPI_API_URL` and `STRAPI_API_TOKEN` from `.optional()` to required so a misconfiguration fails at build/boot instead of silently falling back to local data.

---

## Verification checklist

- [ ] `STRAPI_API_URL` set → pages render CMS content (not local data).
- [ ] `pnpm test` passes (mapper contract tests guard every content shape).
- [ ] Publish an entry in Strapi → the corresponding page updates within seconds without a redeploy.
- [ ] `POST /api/revalidate` with a wrong secret returns `401`; with no secret configured returns `501`.
- [ ] `generateStaticParams` (product/article slugs) resolves from Strapi.
- [ ] OG images, sitemap, RSS, and structured data still resolve.
- [ ] (If preview enabled) preview URL enters draft mode; exit-preview leaves it.
- [ ] CSP `connect-src` includes the Strapi origin; no CSP violations in console; promote to enforcing.

---

## Rollback

Unset `STRAPI_API_URL`. Every feature immediately reverts to local in-repo data with identical types and behavior. No code change or redeploy of application logic required.
