# Momo Audio

A reference-grade storefront and editorial site for a fictional audio brand, built on **Next.js 16 (App Router) + React 19**, TypeScript, Tailwind v4, and shadcn/ui.

The app runs today against local, in-repo data. It is architected so that a **Strapi headless CMS** can be connected later by flipping environment variables — no page, component, or route changes required. See [`docs/strapi-migration.md`](docs/strapi-migration.md).

---

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # optional today; all vars are optional until Strapi is connected
pnpm dev                     # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | All Vitest unit + integration tests |
| `pnpm test:unit` | Unit tests only (mappers, SEO, Strapi client) |
| `pnpm test:integration` | Integration tests (feature APIs, revalidate route) |
| `pnpm test:coverage` | Vitest with coverage |
| `pnpm test:e2e` | Playwright browser tests (smoke, SEO, axe) |
| `pnpm test:smoke` / `:seo` / `:axe` | Individual Playwright suites |
| `pnpm test:all` | Unit/integration + e2e |

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Rendering model (RSC + client islands), feature-based structure, the data seam, caching |
| [`docs/strapi-migration.md`](docs/strapi-migration.md) | Step-by-step CMS go-live runbook, webhook + preview setup, checklist |
| [`docs/environment.md`](docs/environment.md) | Every environment variable, what it controls, and when it's required |
| [`docs/testing.md`](docs/testing.md) | The QA suite layout and how each layer maps to the architecture |
| [`docs/conventions.md`](docs/conventions.md) | Coding conventions: server-first, zod boundaries, feature barrels, cache tags |

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui, Framer Motion
- **Validation:** Zod (the trust boundary for all external data)
- **Env safety:** `@t3-oss/env-nextjs`
- **Analytics:** `@vercel/analytics`
- **Testing:** Vitest (unit/integration), Playwright + axe-core (e2e/a11y)
- **CMS (planned):** Strapi, connected via the data seam
