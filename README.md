# Momo Audio

A reference-grade storefront, admin platform and email builder for a fictional audio brand, built on **Next.js 16 (App Router) + React 19**, TypeScript, Tailwind v4, shadcn/ui, Prisma on Neon Postgres and Better Auth.

It's a working commerce system: a storefront with Stripe checkout, an admin area for catalog, orders and customers, a block-based email builder with campaigns, and a documentation library written for every audience. Content runs on in-repo data today, and the app is built so a **Strapi headless CMS** can be connected later by changing environment variables. See [`docs/strapi-migration.md`](docs/strapi-migration.md).

---

## Highlights

- **Email builder:** block-based templates with Product picks from the live catalog, undo/redo, version history (last 50 saves, original always kept), a placeholder picker with typo warnings, saved sections, a starter gallery with seasonal campaigns (Black Friday, Bank Holiday, Christmas), and locked blocks.
- **Defence-in-depth permissions:** admin access and lock permission are checked in the request proxy, again in every server action, and again in the UI. Business rules live in small, pure, tested modules (`lib/auth/permissions.ts`, `features/email/lib/content/locks.ts`).
- **Test-driven:** every feature sprint started with failing tests. The Vitest unit and integration suites run in seconds without a database or network, and Playwright covers smoke, SEO and accessibility.
- **Docs for every audience:** customer guides, content-manager guides, developer architecture with ER, sequence and flow diagrams, CTO pages (engineering quality, decision records, security posture) and a changelog, all served at `/docs`.

## Quickstart

```bash
pnpm install
cp .env.example .env.local   # all vars are optional at boot; set what you need (see docs/environment.md)
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
| `pnpm test:unit` | Unit tests (pure rules, mappers, SEO, Strapi client) |
| `pnpm test:integration` | Integration tests (server actions, permissions, feature APIs) |
| `pnpm test:coverage` | Vitest with coverage |
| `pnpm test:e2e` | Playwright browser tests (smoke, SEO, axe) |
| `pnpm test:smoke` / `:seo` / `:axe` | Individual Playwright suites |
| `pnpm test:all` | Unit/integration + e2e |

## Documentation

### Repository docs

| Doc | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | Rendering model, feature-based structure, the data seam, caching, the email builder and the three permission layers |
| [`docs/contributing.md`](docs/contributing.md) | The sprint workflow: tests first, small PRs, squash-merge, docs updated with the code |
| [`docs/testing.md`](docs/testing.md) | QA suite layout and how each layer maps to the architecture |
| [`docs/environment.md`](docs/environment.md) | Every environment variable, including the lock-permission allow-list |
| [`docs/conventions.md`](docs/conventions.md) | Coding conventions: server-first, zod boundaries, feature barrels, cache tags |
| [`docs/strapi-migration.md`](docs/strapi-migration.md) | CMS go-live runbook, webhook and preview setup |
| [`docs/showcase-reset-and-stripe.md`](docs/showcase-reset-and-stripe.md) | Resetting demo data, and going live with your own Stripe test keys |

### In-app docs (`/docs`)

| Start here | For |
| --- | --- |
| `/docs/whats-new` | Everyone: dated changelog of recent work |
| `/docs/engineering-quality` | CTOs and recruiters: how the work is built and tested |
| `/docs/architecture-decision-records` | CTOs and developers: the key decisions and their trade-offs |
| `/docs/security-and-compliance-posture` | Security reviewers: permissions matrix and defence in depth |
| `/docs/email-platform-architecture` | Developers: ER, sequence, state and flow diagrams |
| `/docs/email-seasonal-campaigns` | Content managers and clients: walkthrough with real email screenshots |
| `/docs/platform-glossary` | Everyone: plain-English terms |

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript
- **Data:** Prisma on Neon Postgres
- **Auth:** Better Auth with server-enforced roles and a request proxy
- **Payments:** Stripe
- **Email:** Resend, with a pure block renderer
- **Styling:** Tailwind CSS v4, shadcn/ui, Framer Motion
- **Validation:** Zod (the trust boundary for all external data)
- **Env safety:** `@t3-oss/env-nextjs`
- **Analytics:** `@vercel/analytics`
- **Testing:** Vitest (unit/integration), Playwright + axe-core (e2e/a11y)
- **CMS (planned):** Strapi, connected via the data seam
