# Architecture

## Overview

Momo Audio is a Next.js 16 App Router application. Three principles shape the codebase:

1. **Server-first rendering.** Pages are async Server Components that fetch data on the server. Client JavaScript is limited to small leaf "islands" that genuinely need interactivity or animation.
2. **Feature-based structure.** Domain code (products, articles, timeline) lives in self-contained `features/*` folders, each exposing a public API through a barrel file.
3. **A single data seam.** Every feature reads through one `fetch*` layer that either serves local in-repo data or the Strapi CMS, decided by a single environment variable. Swapping the source changes nothing upstream.

---

## Rendering model: Server Components + client islands

### Server Components (the default)

All routes under `app/` are async Server Components. They:

- fetch data server-side through the feature `api` layer,
- wrap slow or below-the-fold content in `<Suspense>` with skeleton fallbacks,
- pass plain, already-validated data down as props.

Data fetching never happens in `useEffect`. It happens on the server, in the page or in a Server Component it renders.

### Client islands (the exception)

A component is marked `"use client"` **only** when it needs the browser: state, event handlers, or animation that depends on layout/mount. Examples:

- `components/primitives/reveal.tsx` — a small entrance-animation wrapper (respects `prefers-reduced-motion`).
- `components/primitives/search-field.tsx` — a debounced input that syncs a `q` URL param.
- `components/layout/page-hero.tsx` — mount-driven entrance animation.
- `lib/cart-context.tsx`, `lib/auth/auth-context.tsx` — client context providers.

**Rule of thumb:** presentational content (cards, statements, specs) stays on the server. If such a component only needs an entrance animation, it wraps its markup in `<Reveal>` rather than becoming a client component itself. This keeps the client bundle small and pushes interactivity to the leaves. See [`conventions.md`](conventions.md).

---

## Directory layout

```
app/                     App Router routes, layouts, boundaries, API routes
  api/
    revalidate/          Strapi publish webhook -> revalidateTag
    preview/             Enter draft mode (inert until STRAPI_PREVIEW_SECRET set)
    exit-preview/        Leave draft mode
  error.tsx              Route-level error boundary
  global-error.tsx       Root-layout error boundary (self-contained HTML)
  not-found.tsx          404
  <route>/               about, account, articles, checkout, contact, onboarding,
                         products, sign-in, sign-up
  sitemap.ts robots.ts opengraph-image.tsx   SEO surfaces

features/                Self-contained domain modules
  products/ articles/ timeline/
    api/                 Data access — THE SEAM (local data vs Strapi)
    schema/              Zod schemas + inferred domain types
    mappers.ts           Strapi raw shape -> pre-validation domain shape
    lib/                 Pure helpers (selectors, filters) — unit tested
    components/          Feature UI (mostly Server Components + skeletons)
    index.ts             Public barrel — the only import surface

lib/                     Cross-cutting concerns
  strapi/                client.ts (transport), tags.ts (cache tags), media.ts
  data/                  Local in-repo content (fallback source)
  auth/ cart-context.tsx contact/ reviews/ seo/ env.ts format.ts nav.ts

components/              Shared UI (layout, home, contact, primitives, ui/*)
hooks/                   Shared React hooks
qa/                      Test suite (see docs/testing.md)
```

---

## The data seam

This is the most important part of the architecture. Each feature's `api/index.ts` exposes async functions (`fetchProducts`, `fetchProduct`, etc.) with **stable return types**. Internally each function branches on whether Strapi is configured:

```ts
const useStrapi = Boolean(env.STRAPI_API_URL)

export async function fetchProducts(): Promise<Product[]> {
  if (useStrapi) {
    return fetchStrapi("/api/products?populate=*", {
      parse: (data) => productSchema.array().parse(toEntries(data).map(mapStrapiProduct)),
      tags: [strapiTags.products.all()],
      revalidate,
    })
  }
  return productSchema.array().parse(getAllProducts()) // local data
}
```

Both branches end in the **same** `productSchema.parse(...)`, returning the **same** `Product` type. Pages, `generateStaticParams`, and Suspense boundaries never know or care which source produced the data.

### Layers in one read

```
Page (RSC)
  -> feature api  fetchProducts()          // decides source, attaches cache tags
     -> fetchStrapi()                       // transport: URL, token, timeout, retry, unwrap
        -> mapStrapiProduct()               // anti-corruption: CMS field names -> domain shape
           -> productSchema.parse()          // zod: the trust boundary
              -> Product                      // validated domain type
```

Responsibilities are deliberately separated:

- **`lib/strapi/client.ts` (`fetchStrapi`)** — the one hardened transport. Builds the URL, attaches the bearer token, times out slow requests (`AbortSignal.timeout`), retries transient network/5xx failures with backoff, and unwraps Strapi's `{ data, meta }` envelope. It does **not** validate — the caller passes `parse`.
- **`features/*/mappers.ts`** — the only place that knows Strapi's field names and media envelope. Tolerates both Strapi v5 (flat) and v4 (`{ id, attributes }`) shapes. If the CMS content-type drifts from the contract, it fails loudly here, at the boundary.
- **`features/*/schema`** — zod schemas that are the single source of truth for domain types (`type Product = z.infer<...>`).

Throwing on failure is intentional: the app's `error.tsx` / `not-found.tsx` boundaries catch it and render fallback UI.

---

## Caching & revalidation

CMS reads attach **cache tags** from `lib/strapi/tags.ts` via `fetch(..., { next: { tags } })`. The tag taxonomy is shared by the producer (fetch) and the consumer (webhook) so they can't drift:

- `products` / `product:<slug>`
- `articles` / `article:<slug>`
- `timeline`

When an editor publishes in Strapi, a webhook hits `POST /api/revalidate`, which maps the content-type `model` to its tags via `tagsForModel()` and calls `revalidateTag` for each — so only the affected pages refresh, instantly, without a redeploy. A background `revalidate` window (`STRAPI_REVALIDATE_SECONDS`) acts as a safety net.

---

## Boundaries

| File | Catches |
| --- | --- |
| `app/error.tsx` | Errors within a route subtree (client boundary, offers retry) |
| `app/global-error.tsx` | Errors in the root layout itself (ships its own `<html>/<body>`, dependency-free) |
| `app/not-found.tsx` | 404s and `notFound()` calls |
| `app/products/[slug]/loading.tsx`, `app/articles/[slug]/loading.tsx` | Route-level streaming fallbacks |

List pages stream through in-component `<Suspense>` + skeletons rather than a route-level `loading.tsx`.

---

## Security headers

`next.config.mjs` sets baseline response headers on all routes: `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`, and a **report-only** CSP seeded with the origins the app calls (Supabase, Vercel Analytics). When Strapi is connected, add its origin to `connect-src` and then promote the CSP from report-only to enforcing. The v0 preview strips framing/CSP headers; they apply fully on the deployed site.
