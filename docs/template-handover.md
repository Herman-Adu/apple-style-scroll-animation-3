# Template handover

This repository is a **prototype template**, not a production go-live runbook. Use it as a starting point for a new product and replace demo assumptions before launch.

## Copy/paste context for v0

Use this block as your kickoff context in v0 so you do not need to re-type sprint history.

> We are continuing from `apple-style-scroll-animation-3` in template mode.  
> `main` is continuity-synced through the latest ledger station and all mandatory in-repo quality/continuity work is complete.  
> Keep scope to fork-readiness, docs quality, showcase/social assets, and media regeneration.  
> Do not reopen product feature work unless explicitly requested.  
> Follow test-first, run full gates (`tsc`, lint, arch, unit, integration, smoke, axe), and keep `docs/next-steps.md` synced in the same sprint.

## What was completed here (and why)

### 1) Template positioning and handover closure

- **What shipped:** template-mode closeout and continuity governance across S5+ follow-up stations, including repeated ledger/guard syncs.
- **Why:** to keep this repo as a reusable baseline, avoid drift after squash merges, and make handoff deterministic for the next agent.

### 2) Testing and quality ratchets

- **What shipped:** stable multi-layer test stack in `qa/` (unit/integration/smoke/seo/axe), plus continuity guards in docs tests.
- **Why:** to preserve behavior while fast-following docs/showcase updates and to prevent silent regressions in handoff-critical files.

### 3) Architecture and security posture

- **What shipped:** architecture checks and security/auth hardening are already reflected in the sprint ledger and remain green in routine gate runs.
- **Why:** template consumers need a trustworthy baseline where core engineering hygiene is already established before domain-specific customization.

### 4) Showcase and social collateral foundation

- **What shipped:** scripted generation paths and in-app docs content for social launch, portfolio framing, and demo narrative.
- **Why:** downstream work now focuses on regenerating/editing collateral, not building the pipeline from scratch.

## Fork and rebrand checklist

1. Fork this repo into your own GitHub org/user.
2. Rename project/app metadata and public brand strings.
3. Replace demo assets in `public/` (products, heroes, showcase, docs media).
4. Rewrite customer-facing legal/support pages (`/terms`, `/privacy`, `/returns`, `/shipping`, `/warranty`).
5. Update docs and `/docs` content to your domain, workflows, and promises.

## Environment variables to replace

Set your own values in deployment and local env files.

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_SITE_URL`

If optional providers stay enabled (Strapi/analytics/extra auth), replace those keys before enabling flows.

## Social/video materials workflow (for your next v0 sessions)

### Primary outputs to regenerate

- Storefront demo clip + poster:
  - `public/showcase/video/storefront/landscape.mp4`
  - `public/showcase/video/storefront/landscape.jpg`
- Social carousel/squares:
  - `public/showcase/social/email-case-study/carousel.pdf`
  - `public/showcase/social/<group>/*.png` (one folder per audience or topic)
- Docs showcase imagery:
  - `public/docs/showcase/*.png`

### Commands

- `pnpm showcase:video` (Playwright capture + encode flow)
- `pnpm showcase:assets` (social asset render flow)

### Narrative/source docs for social content

- `features/docs/content/social-launch-pack.ts` (ready-to-post pack: how to use it, channel plan, Telegram and checklist)
- `features/docs/content/social-launch-pack-recruiter.ts` (LinkedIn, X and Telegram posts for the recruitment audience)
- `features/docs/content/social-launch-pack-client.ts` (LinkedIn, X and Telegram posts for the client and template-sales audience)
- `features/docs/content/social-launch-kit.ts`
- `features/docs/content/showcase-and-portfolio.ts`
- `features/docs/content/social-and-recruitment-marketing.ts`
- `features/docs/content/case-study-email-platform.ts`

### Post templates to adapt (important)

When handing off to v0 for content production, explicitly ask it to deliver:

- adapted post copy per channel (LinkedIn, X, Telegram, portfolio)
- refreshed carousel sets (cover + sequence slides)
- short native video variants (clip + poster)
- **beautiful modern infographics** aligned to your brand tokens (clean typography, high contrast, concise data storytelling) to publish alongside posts and carousel assets

Treat infographics as first-class outputs, not optional extras: each major post/campaign should have at least one infographic concept and export-ready image.

#### Example pairing: LinkedIn architecture angle + senior-dev infographic

Use this as a direct template when producing launch posts and matching visuals.

**Post copy (adapt before publishing):**

```text
I built a server-first commerce platform with its own email system — no rented ESP.

A few decisions I am proud of:

- Server-first rendering: pages are React Server Components by default; the browser only gets interactive islands. Fast pages, better SEO.
- A port/adapter seam sits between the UI and the data source, so swapping the local corpus for a Strapi CMS is a config change, not a rewrite.
- Email is owned, not rented: branded block-based templates, campaigns, and 1:1 customer messaging running on our own domain and Postgres — beside real order data.
- Access control is enforced on the server: gated docs are never serialized to a browser without the role.

Written up end to end, with diagrams, for users, admins, and engineers.

Live: [your-url-here]

#nextjs #react #typescript #softwarearchitecture
```

**Companion infographic deliverable (required):**

- Format: 1080×1350 portrait for LinkedIn.
- Style: modern, premium, high-contrast, clean typography, concise technical language.
- Title: `Server-First Commerce Architecture (Senior Build Decisions)`.
- Four blocks (icon + one outcome each):
  1. RSC-by-default rendering → faster loads, less client JS, better SEO.
  2. Port/adapter data seam → local corpus ↔ Strapi swap without rewrite.
  3. Owned email platform on own domain/Postgres → no ESP lock-in + tighter order-data integration.
  4. Server-enforced access control → gated docs never serialized to unauthorized viewers.
- Footer CTA: `Full write-up + live demo: [your-url-here]`.

When asking v0 to generate this, request both the post copy adaptation and the infographic in the same output batch.

## Docs to update first in your fork

Update these early so handoff context and public claims stay coherent:

1. `docs/next-steps.md` — reset from template continuity to your fork's own sprint ledger.
2. `README.md` — replace template framing with your product framing.
3. `docs/template-handover.md` — keep as your living transfer doc between agents.
4. `docs/testing.md` + `qa/README.md` — keep run commands and coverage policy aligned with your CI.
5. `docs/showcase-reset-and-stripe.md` — replace demo Stripe/reset assumptions with your live process.
6. `features/docs/content/*.ts` entries used by `/docs` — especially social/showcase/sales content.
7. `docs/showcase-pipeline.md` — the seed, record, cut, export and clean-up steps for videos and carousels.

## Features added since the first handover

- **Back-in-stock alerts** (`features/stock-alerts`, additive `StockAlert` table): Notify me form on sold-out products, one email per person on restock, token unsubscribe, Waiting column and Most wanted card in admin.
- **Sign-in-only checkout**: `/checkout` requires a session; guests are redirected to sign in and returned.
- **Showcase pipeline** (`features/showcase`, `scripts/showcase-*.mjs`): seeded demo data, recorded clips and cuts, generated facts, and eight LinkedIn carousel PDFs. See `docs/showcase-pipeline.md`.

## Keep vs delete before production

Keep:

- Feature-slice architecture in `features/` and shared infra in `lib/`
- Test stack in `qa/`
- Architecture and continuity protocols (`pnpm arch`, `docs/next-steps.md` style discipline)

Replace/delete:

- Demo/social/showcase assets that are not part of your launch narrative
- Demo database rows: run `pnpm showcase:unseed -- --confirm` (removes only rows tagged as demo)
- Demo copy/case-study placeholders and fictional assumptions
- Any legal/compliance text not specific to your business

## Production-readiness gap summary

This template is intentionally handover-oriented:

- Engineering gates and architecture ratchets are in place.
- Continuity governance is in place and should be preserved in your fork.
- Stripe/checkout scaffolding is suitable for onboarding, but live compliance and payment rollout are fork-specific.

Use this baseline to plan your own launch sequence after forking.
