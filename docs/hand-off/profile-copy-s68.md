# Profile copy — agreed 2026-10-16 (source of truth for S68)

Agreed in full with Herman. Nothing here is a draft. S68 lands this into
`features/docs/content/social-launch-pack-recruiter.ts` and `-client.ts`,
test-first, on branch `v0/s68-profile-copy`.

**Numbers rule:** when this goes into the pack files, `219` and `2,002` must be
written as the `prs` and `tests` template values (read from
`facts.repo.mergedPrs` and `facts.tests.total`), never typed in. Scope them to
Momo Audio, never to Herman's work generally.

---

## Channel split

| Channel | Audience | Voice |
|---|---|---|
| Herman Adu — LinkedIn personal | Recruiters, hiring managers | Senior full-stack, permanent or contract |
| Adu Dev — LinkedIn Company Page | Direct business clients | Built-and-run platforms |
| Adu Dev — Facebook business page | Direct business clients | Same as above, shorter |

LinkedIn allows only one personal profile, so Herman's personal profile is
recruiter-first with a single closing line that opens the client door and
points at Adu Dev.

---

## 1. Herman Adu — LinkedIn personal

### Headline (agreed — option B)

Senior Full-Stack Engineer (Next.js · React · TypeScript · Prisma) — shipping production platforms for UK businesses. Test-first, CI-enforced architecture, docs the next team can use.

### About

I'm a full-stack engineer. I design and build the platforms businesses run their day on — and I build them so the next team can run them without me.

**Nexgen Electrical Innovations** (Apr 2025 – present, Lead Developer & Consultant). I architected and built the complete digital platform for a NICEIC-approved UK electrical contractor working in EV infrastructure and residential, commercial and industrial installation. Next.js 16 and React 19 with a Server Components-first architecture, strict TypeScript and Tailwind v4 throughout, Clerk authentication with organisation-level permission gating, and six multi-step schema-validated enquiry and quotation flows — each one Zod-validated, bot-protected with Cloudflare Turnstile, rate-limited with Arcjet, and backed by a test-first schema. A Strapi headless CMS drives case studies and a news hub now running 17 articles with category filtering and RSS. SEO is engineered to open-schema standards — JSON-LD, dynamic sitemap, generated Open Graph images. Email-gated campaign pages cover EV charging infrastructure (site survey through DNO approval, OZEV grants and Monta integration) and an EICR landlord compliance guide. Branded transactional email runs through Resend with webhook delivery tracking, behind a DMARC hardening programme now at 25% reject. Quality gates run in GitHub Actions — type-check, lint, unit and Playwright E2E, Lighthouse CI green on main, a Playwright-driven CSP audit gate — deploying continuously to Vercel. I also ran the domain, hosting and mailbox migration, and the brand transition from the prior Intact Electrical site. It is live and it is theirs.

**Momo Audio** is my own commerce platform, built to show what my standard looks like when I control every variable. 219 pull requests, each one opened with a failing test written first. 2,002 automated tests plus browser smoke and accessibility checks before anything merges. Permissions verified on the server in three places — the request proxy, every server action, and the UI — so gated content never reaches a browser without the role. Architecture rules enforced by CI rather than by memory: a ratchet fails the build if deep imports, `any` types or `useEffect` counts get worse. And it owns its own email — block-based templates, campaigns and customer messaging on the store's own domain and database, rather than renting a service and copying products between tools. All of it documented publicly, with diagrams, for five audiences from a first-time user to a CTO.

**On AI-assisted development:** I run a Claude Code pipeline with custom agents, a hook system, structured skills and a Docker MCP stack (Caddy gateway, GitHub, Playwright, sequential-thinking, and a persistent knowledge-graph memory store so architectural decisions survive between sessions). On top of it I built a multi-project governance framework: structural enforcement hooks — scope-fence, controller-edit guard, manifest-freshness gate — per-agent model-floor routing that reserves premium models for judgement and review, and a tool-agnostic secret-safety scanner with exfiltration detection and post-execution redaction. It is genuinely faster, but it is only as good as the engineer directing it: the harness, the rules and the review standards are my engineering judgement written down. The tests and the CI ratchets exist precisely so that speed never becomes a quality trade.

**Stack:** TypeScript, Next.js (App Router, Server Components, Server Actions), React 19, Tailwind, Prisma, PostgreSQL/Neon, Better Auth and Clerk, Stripe, Resend, Strapi, Zod, React Hook Form, Zustand, Vitest, Playwright, Docker, GitHub Actions, Vercel. Currently playing with TanStack and Astro.

**What I'm looking for:** senior full-stack or product engineering work, permanent or contract, UK-based or remote.

Don't take my word for it — read the engineering write-up: https://momo-audio.adudev.co.uk/docs/engineering-quality

For businesses who want a platform built and run for them rather than a hire, that's what I do through Adu Dev.

### Experience entry — Nexgen

Use Herman's own LinkedIn write-up verbatim (the corrected version:
residential/commercial/industrial, the AI governance bullets, the 17-article
news hub, the EICR 12-step PDF). Confirm the end date is still blank so
LinkedIn computes the duration itself.

---

## 2. Adu Dev — LinkedIn Company Page

### Tagline (120 char limit)

Commercial websites and platforms, built properly and kept running. Next.js, Strapi, Stripe. UK.

### Overview

Adu Dev builds the website and the systems behind it — and then keeps them running.

Most businesses end up with a site someone built once and nobody maintains, stitched to four monthly subscriptions that don't talk to each other. We build the opposite: one platform that owns its own content, its own customer enquiries and its own email, on your domain and your database.

**What that includes:** a fast, modern site built on Next.js that search engines and customers both reward. A content system your team can update without calling us. Enquiry, quote and booking flows with spam and bot protection. Branded email that lands in the inbox, with delivery tracking. Payments through Stripe. Secure staff logins with proper permissions. And automated testing and deployment, so a change goes live in minutes without breaking what already worked.

**How we work:** every change is tested before it ships. Accessibility and performance are checked automatically, not hoped for. Everything is documented, so you're never held hostage by the person who built it.

**Recent work:** the complete digital platform for Nexgen Electrical Innovations, a NICEIC-approved electrical contractor specialising in EV charging infrastructure — site, CMS, enquiry and quotation flows, campaign landing pages, email security and hosting, end to end. nexgen-electrical.co.uk

We build it, we host it, we run it. You own the result.

Based in Maidenhead, working with businesses across the UK.

---

## 3. Adu Dev — Facebook business page

### Short description (255 char limit)

We build commercial websites and the systems behind them — content, enquiries, payments and email on one platform you own. Built properly, tested before every release, and kept running. Maidenhead, UK.

### Long description

Use the LinkedIn Company Page overview above, unchanged.

---

## 4. Banner wording (agreed — for the image terminal)

Keep from the approved "green arrow" layout: dark circuit-board treatment,
headshot placement, Next.js / Strapi / TypeScript / AI tiles, white-and-orange
type. Replace the wording entirely.

**Personal banner (1584x396):**

- `HERMAN ADU`
- Senior Full-Stack Engineer
- Next.js 16 · React 19 · TypeScript · Prisma

**Adu Dev banner:**

- `BUILT PROPERLY. KEPT RUNNING.`
- Commercial websites and the systems behind them

**Rejected, do not reuse:** "EDU + AI DEV" (reads as a training brand, not an
engineer) and "ENTERPRISE AI SYSTEMS. BUILT TO SCALE." (sells AI products,
which is not the offer — it draws the wrong enquiries).

**Generation method:** image-to-image editing with the real headshot as the
reference. The earlier set was text-to-image, which re-drew Herman's face on
every option except the green-arrow one.

---

## 5. Why the old copy was replaced

- The previous write-up was built entirely from Momo Audio, so it read as
  commerce-only. Nexgen — a live client platform — carries the breadth.
- The old headline ("An honest, ethical, hardworking individual...") carried no
  searchable stack terms and cost search matches.
- The AI-assisted work is a supporting paragraph, not the lead. Herman's
  position: AI assistance is only as good as the engineer directing it, and the
  harness, hooks and skills are his engineering judgement encoded.
- There is no LinkedIn MCP worth adding: LinkedIn's API has no write access to
  a personal profile, and community servers are scrapers that risk the account.
  Copy gets written here and pasted by hand.

---

## 6. S68 scope

1. Branch `v0/s68-profile-copy` off refreshed `main`.
2. Failing test first in `qa/unit/docs/social-launch-pack.test.ts`.
3. Add a profile-copy section to `social-launch-pack-recruiter.ts` (headline,
   About) and `social-launch-pack-client.ts` (tagline, overview, Facebook
   description). Numbers via the `prs` / `tests` values already read from
   `facts`, not typed in.
4. Green: tsc, lint, unit, integration, smoke, axe. PR, squash-merge.
5. Ledger row in `docs/next-steps.md` and a fresh "Next session starts here".
