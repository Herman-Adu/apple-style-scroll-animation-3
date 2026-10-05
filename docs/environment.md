# Environment variables

All variables are read through `lib/env.ts` (`@t3-oss/env-nextjs`), which validates them at build/boot so a misconfiguration fails fast with a clear message instead of surfacing as `undefined` deep in the app. **Import `env` from `@/lib/env` — never read `process.env` directly.**

Every variable is currently `.optional()` because the app runs against local data. Tighten the Strapi ones to required once the CMS is permanent (see [`strapi-migration.md`](strapi-migration.md)).

Empty strings are treated as unset (`emptyStringAsUndefined: true`), so a blank value won't pass a URL check.

**Prisma datasource note:** Prisma in this project reads its datasource URL from `POSTGRES_PRISMA_URL` (not `DATABASE_URL`). Set `POSTGRES_PRISMA_URL` for Prisma-related operations (migrations, generate, and the Prisma client). `DATABASE_URL` is kept for other consumers; when unsure, set both to the same connection string.

---

## Server-only

These are never exposed to the client bundle.

| Variable                    | Required                                | Controls                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRAPI_API_URL`            | When using CMS                          | **The seam switch.** Presence moves every feature's data access from local data to Strapi. Base URL of the Strapi instance.                                                                                                         |
| `STRAPI_API_TOKEN`          | When using CMS                          | Read-only API token sent as `Authorization: Bearer` on every Strapi request.                                                                                                                                                        |
| `STRAPI_WEBHOOK_SECRET`     | For instant revalidation                | Shared secret the Strapi publish webhook sends to `POST /api/revalidate`. If unset, the webhook route is disabled (`501`). Generate with `openssl rand -base64 32`.                                                                 |
| `STRAPI_REVALIDATE_SECONDS` | No                                      | Background revalidation window (seconds) for CMS fetches. Publish webhooks still invalidate instantly; this is the safety-net refresh interval.                                                                                     |
| `STRAPI_PREVIEW_SECRET`     | For editor preview                      | Shared secret in Strapi preview URLs. `/api/preview` enables draft mode only when the URL's `secret` matches. If unset, `/api/preview` returns `404`.                                                                               |
| `STRIPE_SECRET_KEY`         | For checkout                            | Server-side Stripe key used to create embedded Checkout Sessions (`features/checkout/lib/actions/checkout.ts`, `lib/stripe/server.ts`). Until set, checkout can't create a payment.                                                 |
| `STRIPE_WEBHOOK_SECRET`     | For checkout                            | Verifies `POST /api/stripe/webhook` events before trusting them. Until set, the webhook route rejects events by design (fails closed, not open).                                                                                    |
| `STRIPE_PUBLIC_ORIGIN`      | No                                      | Optional public origin used by checkout when composing `return_url` and product image URLs for Stripe. Set this in local/dev when your app runs on `localhost` and you want Stripe-hosted surfaces to fetch product images.         |
| `POSTGRES_PRISMA_URL`       | Yes (for Prisma)                        | Pooled Neon Postgres connection string used by Prisma as the datasource URL. Required for `prisma generate`, migrations, and runtime Prisma clients that expect the Prisma-specific env var.                                        |
| `DATABASE_URL`              | Yes (once on `db` auth/orders provider) | Pooled Neon Postgres connection string used by other DB consumers (connection pooling libraries, legacy code). Historically docs referenced `DATABASE_URL` for Prisma — update your local env to set `POSTGRES_PRISMA_URL` instead. |
| `DATABASE_URL_UNPOOLED`     | No                                      | Direct (non-pooled) Neon connection string, for migrations/long-lived connections.                                                                                                                                                  |
| `BETTER_AUTH_SECRET`        | Yes (once on `db` auth)                 | Signs and encrypts Better Auth sessions/cookies. See the `better-auth` skill before changing auth config.                                                                                                                           |
| `BETTER_AUTH_API_KEY`       | No                                      | Enables the `dash()` plugin so dash.better-auth.com can verify ownership of this auth server. Omit to skip that plugin entirely.                                                                                                    |
| `BETTER_AUTH_URL`           | No                                      | Explicit base URL for Better Auth. Falls back to the Vercel production/preview URL, then `V0_RUNTIME_URL` (see `lib/auth/instance.ts`).                                                                                             |
| `RESEND_API_KEY`            | For outbound email                      | Enables transactional email (order confirmations, contact replies, admin campaigns) via `features/email/lib/adapters/sending/provider.ts`. Without it, sends are logged and skipped, never thrown.                                  |
| `EMAIL_FROM`                | No                                      | Verified sender address (`Name <addr@domain>`). Falls back to a safe default sender if unset or malformed.                                                                                                                          |
| `EMAIL_TO`                  | No                                      | Where order/contact notifications land. Falls back to `EMAIL_FROM`, then a default admin address.                                                                                                                                   |

## Public (`NEXT_PUBLIC_*`)

Inlined at build time and visible in the browser. Do not put secrets here.

| Variable                                | Required            | Controls                                                                                                                                                                                                                                                                          |
| --------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                  | Recommended in prod | Canonical public origin for metadata, sitemap, robots, OG images, RSS. Falls back to the Vercel production URL, then `localhost` (see `lib/seo/site.ts`).                                                                                                                         |
| `NEXT_PUBLIC_AUTH_PROVIDER`             | No                  | Selects the auth adapter: `db` (default, Better Auth + Neon) / `local` (localStorage reference) / `strapi` (legacy REST). See `lib/auth/config.ts`.                                                                                                                               |
| `NEXT_PUBLIC_ADMIN_EMAILS`              | No                  | Comma-separated admin allowlist consulted on account creation. Has a built-in default; override to add your own admin addresses.                                                                                                                                                  |
| `NEXT_PUBLIC_OWNER_EMAILS`              | No                  | Comma-separated super-admin allowlist — the only accounts that can read private sales-enablement docs. Owners can always lock and unlock email blocks. Every owner email should also be an admin.                                                                                 |
| `EMAIL_BLOCK_LOCKERS`                   | No                  | Fallback only. Server-only, comma-separated admin emails seeded with lock rights. The primary source is the owner-managed grants in Admin → Settings → Permissions (database). Env-seeded admins show as "Env seed" and can't be revoked in the UI. Never exposed to the browser. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`    | For checkout        | Stripe publishable key (`pk_test_…`/`pk_live_…`) — Stripe.js needs it in the browser to mount embedded Checkout. Safe to expose.                                                                                                                                                  |
| `NEXT_PUBLIC_API_URL`                   | No                  | Optional external API base.                                                                                                                                                                                                                                                       |
| `NEXT_PUBLIC_CONTACT_ENDPOINT`          | No                  | Optional external contact submission endpoint.                                                                                                                                                                                                                                    |
| `NEXT_PUBLIC_REVIEWS_ENDPOINT`          | No                  | Optional external reviews endpoint.                                                                                                                                                                                                                                               |
| `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | No                  | Dev-only Supabase auth redirect override. Already set in this project.                                                                                                                                                                                                            |

> `STRIPE_PUBLISHABLE_KEY` (server-readable, no `NEXT_PUBLIC_` prefix) is also read directly from `process.env` by `lib/stripe/server.ts` rather than through `lib/env.ts`. See [`showcase-reset-and-stripe.md`](showcase-reset-and-stripe.md) for the full Stripe go-live steps, including how to swap in your own account's test keys.

---

## Adding a new variable

1. Add it to the correct section (`server` or `client`) in `lib/env.ts` with a zod validator.
2. Add it to the `runtimeEnv` map (client vars must be destructured explicitly — Next.js inlines them at build time and they can't be read dynamically).
3. Document it in this file and add it to `.env.example`.
4. Import it via `env` from `@/lib/env`.
