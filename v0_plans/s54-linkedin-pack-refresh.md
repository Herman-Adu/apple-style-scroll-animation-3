# S54-S56: the LinkedIn packs stop being out of date

Branch per sprint. Data impact: **none** throughout. No gate in any sprint.

Plan written 2026-10-13 from an audit of the launch packs against a LinkedIn
algorithm video (Chris Donnelly, *How to Dominate the New LinkedIn Algorithm in
19 Minutes*) and independent corroboration. The audit's conclusions about the
video matter less than one structural finding below: **the facts guards cannot
catch the kind of staleness the packs actually have.**

## Why

Three defects, found by measuring rather than reading.

**1. The committed snapshot is stale and nothing can see it.** `lib/facts/snapshot.json`
was generated 2026-10-09 and records 181 merged PRs and 1,617 tests. A re-run of
`pnpm facts` on 2026-10-13 gives **195 PRs and 1,701 tests** (unit 1,482 to
1,566). Every post quoting those numbers understates the work by 14 PRs and 84
tests.

The existing guards structurally cannot catch this:

- `qa/smoke/facts-freshness.spec.ts` recounts **only the browser layers** —
  `smoke`, `seo`, `axe` — against a Playwright `--list`. Those three were
  unchanged, so it passes on a stale snapshot.
- `qa/unit/docs/doc-facts.test.ts` asserts the snapshot is **internally
  consistent** (`unit + integration + smoke + axe + seo === total`). As that
  file's own comment concedes, "a wrong snapshot also is."
- Its stale-number guard is a **hand-written blocklist** of past mistakes
  (`/\b758\b/`, `/\bmore than 140\b/`). A list written by hand only checks the
  past.

So `facts.repo.mergedPrs` and `facts.tests.unit` are the two numbers the posts
lean on hardest and the two nothing recounts.

**2. There is no profile or discoverability copy.** The kit has a profile
headline and a featured-link line (`features/docs/content/social-launch-pack.ts:69-79`)
and nothing else — no About copy, no skills list, no guidance on the Open to
Work setting. For an owner whose goal is *being found* by recruiters rather than
seen in a feed, those fields do more work than any post: recruiter search is
keyword-driven, and LinkedIn's current ranking model matches post content
against the profile it came from. This is the largest genuine gap in the packs.

**3. Two copy claims are false.** Measured from the exported PDFs:

| Carousel | PDF pages |
|---|---|
| buyer, recruiter | 6 |
| checkout-sequence, engineer, security | 7 |
| email-case-study, how-it-was-built | 8 |
| site-tour | 10 |

`features/docs/content/social-launch-kit.ts:52` describes "An 8-slide LinkedIn
carousel (1080x1350)" as though that were the shape of the set; only two of the
eight are 8 pages. Separately, `social-and-recruitment-marketing.ts` says the
docs are written for **four** audiences while `social-launch-pack-client.ts`
says **five**. One of them is wrong in front of a CTO.

All page sizes are correct 4:5 portrait (810x1013pt; PNG slides exactly
1080x1350), so nothing needs re-exporting — only the prose is wrong.

## Not in this plan

Deliberately out of scope, so a sprint does not drift into them:

- **A LinkedIn company-page channel.** `CHANNELS` in
  `features/showcase/lib/domain/posting-calendar.ts` has no company page, and
  the client channel is a Facebook page holding 3 of 16 slots. Adding one needs
  a `DELIVERY` row and — for owner amplification, where a slot must reference
  another slot — a `PostingSlot` schema change. Its own sprint, later.
- **Reconciling the two posting calendars.** `social-and-recruitment-marketing.ts`
  carries a competing two-week calendar that conflicts with the four-week one in
  `social-launch-kit-calendar.ts`.
- **`CALENDAR_START`** is `2026-10-12`, already in the past.
- **Moving post links to the first comment.** Investigated and rejected for now:
  LinkedIn has never confirmed a link penalty, published effect sizes conflict
  (20-35% / 50-70% / a 36% median gap), one ~400k-post analysis found
  multi-link posts performing *better*, and no published test compares a
  first-comment link against a paired body-link on the same accounts. The one
  consistent signal is that company pages absorb the penalty while personal
  profiles show almost none — which argues for leaving body links alone on the
  surface that matters here. Revisit with an owned A/B test, not a rewrite.

---

### S54: the snapshot cannot go stale unnoticed

- **Why:** the two numbers the posts quote most — merged PRs and unit tests —
  are the two no guard recounts. Refreshing the snapshot without closing that
  hole just resets a clock that will drift again; it has already gone stale in
  S44 and S48.
- **Acceptance:**
  1. `lib/facts/snapshot.json` records the current measurements (expected:
     `mergedPrs` 195, `latestPr` 204, `unit` 1,566).
  2. A browser-gate test fails when `facts.repo.mergedPrs` disagrees with the
     count derived from `git log`.
  3. The same test fails when `facts.tests.unit` disagrees with the Vitest
     report.
  4. `pnpm facts` still succeeds end to end, and the existing `doc-facts`
     assertions still pass.
- **Tests first:** extend `qa/smoke/facts-freshness.spec.ts` (**smoke** layer).
  Reuse `countMergedPrs` from `scripts/lib/facts.mjs` rather than re-deriving the
  subject-line parsing, so the guard and the generator cannot disagree. Prove it
  **red against the committed stale snapshot** (181 PRs) before regenerating.
- **Files:** `qa/smoke/facts-freshness.spec.ts`, `lib/facts/snapshot.json`,
  possibly a named export in `scripts/lib/facts.mjs`.
- **Data impact:** none. **Gate:** none.

> **Order of operations — this sprint has a trap.** Adding a spec to `qa/smoke/`
> changes `facts.tests.smoke` (24 to 25) and therefore `total`, because the
> snapshot records its own test counts. So: write the failing test, watch it go
> red, *then* run `pnpm facts`, and commit the test and the regenerated snapshot
> together. Regenerating first guarantees a red gate on the very next run.
>
> **The guard must live in the browser gate, not the unit suite.**
> `scripts/facts.mjs:38` abandons the run when Vitest fails, so a unit-level
> freshness guard would deadlock — the stale snapshot would block the one command
> that repairs it. `pnpm facts` only *lists* Playwright tests, so a failure here
> never does. This is the same reasoning recorded in the existing spec's header
> comment; do not "simplify" the guard into `qa/unit`.

### S55: profile and discoverability copy

- **Why:** gap 2 above. The packs optimise for being seen and say almost nothing
  about being found, which is the owner's stated priority.
- **Acceptance:**
  1. `social-launch-pack` carries a "Profile and discoverability" section with:
     headline variants, About copy, a skills list ordered for recruiter search,
     and a recommendation on the Open to Work setting.
  2. That recommendation is **recruiter-only mode**, with the reason recorded:
     the public green banner reads to a prospective client as "this person is
     leaving", which attacks the handover promise that is the strongest client
     argument. Independent surveys put the badge's effect on recruiter attitudes
     at roughly neutral (one 2023 survey: 91% of hiring professionals say it does
     not deter them), so little is given up.
  3. The `#opentowork` hashtag advice currently sitting in
     `social-and-recruitment-marketing.ts` no longer recommends the public badge
     without that caveat.
  4. The doc stays `access: "owner"`.
- **Tests first:** `qa/unit/docs/social-launch-pack.test.ts` (**unit**) — assert
  the profile section exists and carries each field; assert no client-facing
  block recommends the public banner.
- **Files:** `features/docs/content/social-launch-pack.ts`,
  `features/docs/content/social-and-recruitment-marketing.ts`,
  `qa/unit/docs/social-launch-pack.test.ts`.
- **Data impact:** none. **Gate:** none, but this is copy written in the owner's
  own voice about his availability — he reviews the wording before merge.

### S56: slide counts and audience counts come from the artefacts

- **Why:** gap 3 above. Both claims are prose a reader cannot check, and one is
  measurably wrong.
- **Acceptance:**
  1. The carousel paragraph no longer claims a single slide count for the set.
  2. A test derives each carousel's page count **from the PDF on disk** and
     fails when prose contradicts it, so this cannot drift again.
  3. The audience count is identical in every doc that states it.
- **Tests first:** a **unit** test beside the existing showcase asset guards,
  reading `/showcase/social/*/carousel.pdf` page counts and comparing against the
  kit's stated figures; and an assertion that the audience count appears with one
  value across `features/docs/content/`.
- **Files:** `features/docs/content/social-launch-kit.ts`,
  `features/docs/content/social-and-recruitment-marketing.ts`,
  `features/docs/content/social-launch-pack-client.ts`, plus the new test.
- **Data impact:** none. **Gate:** none.

---

## Running these cold

Per `AGENTS.md`: one sprint, one `v0/<id>-<name>` branch, one PR, squash-merge;
test first; `tsc`, lint, unit, integration, smoke and axe green before merge;
add the ledger row in `docs/next-steps.md` after each merge. Close out with
`pnpm clean` and `pnpm health`.

S54 first — it is the enabler and the smallest. S55 and S56 are independent of
each other and can run in either order.
