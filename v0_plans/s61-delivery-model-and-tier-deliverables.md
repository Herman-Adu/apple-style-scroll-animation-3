# S61-S62 — The delivery model, and what a client receives

Planned from a `grill-with-docs` session (2026-10-14). Four rounds, twenty-seven
decisions, all confirmed by the owner. Terms used here are the ones added to
`GLOSSARY.md` in the same session.

## Why

The ledger's S61 candidate was narrow: `pricing-and-packaging-the-build` names
three tiers (Launch, Growth, Scale) as a scope ladder, and nothing says what a
client actually *receives* at each. True, but the grilling found the gap was one
level deeper than that.

Measured before planning, not assumed:

- The tiers exist only as scope: Launch is "Storefront + docs, CMS seam ready,
  standard content types"; Scale names "SLAs" and "priority support" that are
  defined nowhere.
- A **tier-less** deliverables list is already published:
  `features/showcase/lib/domain/infographic-registry.ts` (`infographic-offer`,
  exported as `/showcase/social/shared/offer.png`) with columns Included /
  Customised for you / Handover.
- That infographic's Handover column promises "Local runbook and environment
  guide" and "Tests and CI left green" — **template handover** (builder-facing)
  leaked into client-facing copy. A live instance of the three-way conflation
  the ledger warned about.
- The owner's own gated material already pitches the opposite business model and
  never connects it to the ladder: `email-selling-points.ts:38` — "one deploy
  can run several brands or clients — sell one build, deploy it N times";
  `showcase-and-portfolio.ts:42` pitches agencies the same way; and
  `product-roadmap.ts:104` has "White-label multi-tenant deploys" in **Later**.
- `Positioning` has an `order` collision: `social-launch-pack` and
  `sales-demo-and-objection-handling` are both `order: 6`. `Business Case` has
  one too: `roi-and-total-cost-of-ownership` and `case-study-email-platform` are
  both `order: 1`.
- The S59 drift guard is reusable machinery, not just a test:
  `features/docs/lib/domain/showroom.ts` parses objections out of the docs named
  in `OBJECTION_SOURCES` and requires each to have a `PUBLIC_ANSWERS` entry whose
  anchor phrases still appear in the named public doc. `OBJECTION_FLOOR = 15`.
- ADRs here are `audience: "developer"`, `access: "public"`, all ten strictly
  technical. Next free number is **011**.
- No `GLOSSARY.md` existed before this session.

### The decision that reshaped the sprint

The platform was deliberately built so a non-technical owner can run the store
without an engineer — dashboard, template editor, presets, offers, messaging. A
product with that property is **rented, not handed over**. Assigning the codebase
at the cheapest tier would price the only compounding asset at zero, convert a
monthly annuity into one payment plus a cancellable maintenance contract, and
leave eight forks in the wild before the Strapi direction starts.

So the delivery model is **built-and-run**: the owner hosts and operates, the
client owns every vendor account, their data and their domain, and their exit is
contractual (data export plus source escrow) rather than a copy of the repo on
day one. Code buy-out is a priced option at **Scale** only. The independence
argument survives intact because it was always an argument about *capability*,
not about the builder's absence.

## Outcome

A client (and the owner) can answer "what do I get at Launch, Growth or Scale,
who runs it, and how do I leave" from a document, and a test fails when the gated
and public halves of that answer come apart.

## Settled decisions this plan implements

| # | Decision |
|---|---|
| 1 | Primary buyer: SMB brand owners. Agencies at the top tier. Developers are a later, separate product line. Funded startups with in-house engineers are explicitly not the target. |
| 2 | Delivery model: built-and-run by default. Source escrow at **every** tier; paid buy-out licence at Scale only. |
| 3 | Pricing shape: fixed **Setup** fee + **monthly**. There is no version of the offer without a monthly, because the owner is hosting. |
| 4 | Four engagement phases: Setup (fixed), Customisation (scoped), Build (scoped), Care (fixed monthly). |
| 5 | Two retainers only: **Care** keeps it working; **Roadmap block** makes it different, at three monthly sizes, available at every tier. No fourth name. |
| 6 | Care covers security, dependency and platform-maintenance updates. New capability is Roadmap block work. |
| 7 | Client owns every vendor account (Stripe, Resend, Neon, Vercel) from day one at every tier; the owner holds delegated, revocable access. |
| 8 | Isolated deployment per client now; multi-tenancy stays in roadmap **Later**. Recorded as public **ADR-011**. |
| 9 | Nine deliverable rows: code access & escrow, vendor accounts, domain & DNS, docs access, training, support window, data export & exit, content types, retainer assumed. Every row has a value at every tier. |
| 10 | Support: Mon-Fri 09:00-17:00 UK, a triage window every weekday, **response** targets (never fix targets) of 3 business days / 1 business day / 4 business hours. An incident (site down, payments failing, email not sending) gets same-day acknowledgement at every tier. **No uptime SLA at any tier.** |
| 11 | Capacity, gated only: 8 concurrent Care clients, 3 client days a week, 2 ringfenced product days. Scale counts as 2 of the 8 slots. The 9th client raises the price rather than filling the slot. |
| 12 | Training: docs and recorded walkthroughs at every tier, plus 1 / 2 / 4 live sessions, recorded and kept. |
| 13 | Content types: Launch standard only, Growth up to 3 custom, Scale unlimited within a Roadmap block. |
| 14 | Data export at every tier, on request: Postgres dump plus media files, within 5 business days, no proprietary format, no exit fee. |
| 15 | Tier *deliverables* are product-neutral, so a second product reuses the ladder. The *scope* table stays commerce-specific. |
| 16 | Single source: the pricing doc keeps "who it's for" and scope; the new doc owns deliverables. |
| 17 | Gated master doc first, public subset derived from it. The public subset states the pricing *shape* and no numbers. |
| 18 | The licence/escrow choice and the monthly are recorded in ADR format **inside the gated doc**, not in the public ADR doc — publishing them would hand a competitor the licensing model. |

## S61: the delivery model, the gated tier deliverables, and ADR-011

- **Why:** the owner cannot quote a tier, and the repo cannot answer "what do I
  get", without this. Everything else in the category is downstream of the
  delivery model, which until now was unrecorded.
- **Acceptance:**
  1. A gated doc `tier-deliverables` ("Tier Deliverables: Launch, Growth &
     Scale") renders in `Positioning`, `access: "owner"`, with all nine rows
     valued at all three tiers, the four engagement phases, the support table,
     the gated capacity model, and a Decisions section in ADR format carrying the
     escrow/licence choice and the monthly.
  2. `pricing-and-packaging-the-build`'s `Reference packaging` table is tightened
     to who-it's-for plus scope only, and links to the new doc for deliverables.
  3. `ADR-011 — Isolated per-client deployments over multi-tenancy` appears in
     the public ADR doc's index and as a record, with the trade-off stated.
  4. `infographic-offer`'s Handover column describes **operational** handover
     (trained team, runbook for operating it, docs site, data export on request,
     escrow) and no longer promises a local runbook or CI.
  5. `Positioning` and `Business Case` `order` values are unique.
- **Tests first:**
  - `qa/unit/docs/tier-deliverables.test.ts` (unit) — every deliverable row has a
    non-empty value for all three tiers; the tier names in the new doc match the
    pricing doc's packaging table exactly; the bare term "handover" never appears
    unqualified in the new doc's text (the glossary forbids it).
  - `qa/unit/docs/doc-domain.test.ts` (unit, extend) — `order` is unique within
    every category. This is the guard that would have caught both collisions.
  - `qa/unit/docs/docs-access.test.ts` (unit, extend) — the new doc is
    `access: "owner"` and its body is never serialized to a non-owner.
  - the nearest existing ADR assertion (unit) — the index row and the record
    heading for 011 both exist and agree.
  - Expect count-pinned assertions in `docs-audit`, `freshness` and `doc-paths`
    to need updating; a new doc changes `facts.docs.pages`.
- **Files:** `features/docs/content/tier-deliverables.ts` (new),
  `features/docs/content/index.ts`,
  `features/docs/content/pricing-and-packaging.ts`,
  `features/docs/content/architecture-decision-records.ts`,
  `features/docs/content/{positioning-and-selling,email-selling-points,showcase-and-portfolio,social-and-recruitment-marketing,social-launch-pack,sales-demo-and-objections,product-roadmap}.ts`
  (order only),
  `features/docs/content/{roi-and-cost-of-ownership,build-vs-buy,case-study-email-platform}.ts`
  (order only), `features/showcase/lib/domain/infographic-registry.ts`,
  `GLOSSARY.md`, `qa/unit/docs/*`.
- **Data impact:** none.
- **Gate:** none. No schema change, no deploy, no secrets. The infographic
  wording is published copy and was approved in the grilling session; the PNG
  itself is deliberately not re-exported here.

## S62: the public answer, wired to the drift guard

- **Why:** a gated-only tier promise re-creates exactly the bug S59 was built to
  fix. The public page is also the one the owner will send most often after a
  call, and edit least — so it needs a guard, not good intentions.
- **Acceptance:**
  1. A public doc `what-you-receive` ("What You Receive") renders in
     `Business Case`, `audience: "cto"`, `access: "public"`, with the nine rows
     per tier, the Setup checklist as a confidence list, the pricing *shape* with
     no numbers, the data-export promise and the escrow terms.
  2. It names the Setup dependency the owner does not control: Stripe account
     verification, business identity checks and tax registration can take days.
  3. The gated doc carries an objection-handling section with four objections —
     "Do we own the code?", "Are we locked into a retainer?", "What if we want to
     move to another developer?", "Why are the Stripe and Resend accounts in our
     name?" — and is added to `OBJECTION_SOURCES`.
  4. Each has a `PUBLIC_ANSWERS` entry anchored in the new public doc, and
     `OBJECTION_FLOOR` rises 15 → 19.
  5. An anonymous visitor can read `/docs/what-you-receive`; the gated doc stays
     invisible to them.
- **Tests first:**
  - `qa/unit/docs/showroom-coverage.test.ts` (unit, extend) — the new source is
    parsed, the floor is 19, every new objection has a public answer, and each
    anchor phrase is present in the public doc. Proposed anchors, reviewable
    before writing: `source escrow` + `release trigger`; `no exit fee` + `your
    data, on request`; `another developer` + `runbook`; `in your name` + `your
    customers pay you directly`.
  - `qa/smoke/*` (smoke) — the public page renders for an anonymous visitor and
    the gated doc is absent from their nav.
  - `qa/axe/*` (axe) — the new page passes.
- **Files:** `features/docs/content/what-you-receive.ts` (new),
  `features/docs/content/index.ts`,
  `features/docs/content/tier-deliverables.ts` (objection section),
  `features/docs/lib/domain/showroom.ts`,
  `qa/unit/docs/showroom-coverage.test.ts`, `qa/smoke/*`, `qa/axe/*`.
- **Data impact:** none.
- **Gate:** none.

## Order

S61 before S62: the gated doc is the source the guard parses, and the public
subset is derived from it. Each closes with the repo's two-PR pattern — the
sprint PR, then a closeout PR carrying the ledger row and the What's New entry
that `qa/unit/docs/changelog-coverage.test.ts` requires.

## Out of scope

- Re-exporting `/showcase/social/shared/offer.png` and every other pack asset.
  That is the standing "full showcase re-export" candidate; S61 changes the
  registry text only.
- Multi-tenancy, white-label deploys, and anything that makes the agency tier
  real in code. ADR-011 records the decision to defer it; roadmap **Later**
  already holds the item.
- The Strapi builder direction. Still unrecorded in the repo and still its own
  candidate sprint; when it lands the whole Positioning category needs a pass,
  because the pitch is currently "owned-email commerce platform".
- Prices. No number for Setup, the monthly, Customisation or the buy-out appears
  in either doc. The gated doc carries the capacity model, which is what
  justifies a number when the owner names one.
- DPAs, a sub-processor list and professional indemnity cover. Real obligations
  of the built-and-run model, but legal and commercial artefacts, not repo
  content.

## One decision left open

**The minimum term of the monthly.** Round 1 settled a mandatory 12-month Care
plan; round 4 superseded it with "setup + monthly, no version without a monthly",
which leaves the term unstated. Recommended default, to be written into both docs
unless the owner says otherwise: **a 12-month initial term, then rolling monthly
with 30 days' notice either side.** It gives the first year the predictability a
sole developer needs, and the rolling continuation reads as confidence rather
than a lock-in a buyer has to negotiate out of.
