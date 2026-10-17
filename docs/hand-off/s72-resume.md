# S72 is half-shipped on a branch. Finish it, do not restart it.

Written 2026-10-17. **Start here in a fresh terminal.** S72 ran out of session
budget mid-sprint; the owner called it at 6% remaining and said not to spend into
overage. Nothing is broken and nothing is lost. Two commits are on
`v0/s72-palette-literals`, both green on tsc, lint and unit, and **neither is
pushed and no PR exists**.

Read `docs/hand-off/s72-palette-literals.md` for the original brief. This file
records only what changed about it.

## 0. State, and the first thing to do

```
branch   v0/s72-palette-literals   (local only, not pushed)
base     origin/main = 6f0a8e7 (S71, #237)
efc02ae  S72: the palette literals a buyer reads, onto tokens measured for their surface
f6270a3  S72a: split docs/next-steps.md, so starting a session stops paying for history
```

Green on this tree: `tsc`, `lint`, unit **1934**. **Not run at all:** `pnpm arch`,
`pnpm test:integration`, `pnpm test:smoke`, `pnpm test:seo`, `pnpm test:axe`,
`pnpm build`, `pnpm facts`, the 73-asset re-export.

Resume with `git fetch origin +refs/heads/main:refs/remotes/origin/main` and
`git checkout v0/s72-palette-literals`. Do **not** branch again from `main` and
do not redo the work below - the repo decides, and the repo has it.

## 1. Two corrections to the original brief

### 1a. Vercel previews are back ON. Section 0a of the brief is out of date.

The brief says previews were switched off on 17 Oct ("Only build production")
and records that as closed, with an instruction to verify no Vercel check
appears on the PR. **The owner turned them back on the same day**, mid-sprint,
because "resources on Vercel look good for now". So expect a Vercel check on
S72's PR; its *absence* would be the surprising thing.

He has now decided this twice in one day, in both directions, on resource
grounds. Do not propose changing it either way, and read the live state off the
PR rather than from any brief - including this one. Deploy and repo settings
are still a gate.

### 1b. The split cut more than the brief predicted.

The brief estimated ~75%. `docs/next-steps.md` went **439 lines / 88.6 KB ->
114 lines / 7.3 KB**, a 92% cut, because the three "Next sprints" candidate
sections turned out to be history too and went to `docs/sprint-ledger.md` with
the ledger table and the `Current state (synced)` bullets.

## 2. What is done, so it is not done twice

**S72a (`f6270a3`) - the approved split.** `docs/sprint-ledger.md` is new and
holds the merge history, the kickoff notes and the candidate sections.
`docs/next-steps.md` keeps the snapshot, the next-session block and the sprint
protocol. S71's merge SHA is filled in as `6f0a8e7` and its 3,721-byte ledger
row is cut to 593 as the worked example.

`qa/unit/docs/ledger-split.test.ts` is the new guard: ledger rows refused in
`next-steps.md` **by shape**, `next-steps.md` must name the file the history
moved to, and it is held to 150 lines / 20 KB. Three reds were shown on the real
files, each with the edit asserted to have landed first:

- the guard before the split: `{"lines":440,"bytes":88594}` against 150/20,000;
- `changelog-coverage` with `LEDGER` pointed back at `next-steps.md`: `expected
  'S71' to be undefined`, which is what proves it reads the new path;
- the snapshot drifted to S70: `expected 'S70' to be 'S71'`;
- a ledger row appended to `next-steps.md`: named at line 116.

`changelog-coverage`, `template-handover` and `social-launch-pack` read the
history by its new path. Prose updated in `AGENTS.md`, the PR template, two
skills, `docs/contributing.md`, `docs/template-handover.md`,
`features/docs/lib/domain/changelog.ts` and the in-app contributing guide
(`updatedAt` bumped to 2026-10-17).

**S72 (`efc02ae`) - the literals.** All 19, in eight files, with every ratio
measured; the commit message carries the per-file detail and the reasoning, and
it is the canonical account. Ratchet 127 -> 108.
`qa/unit/theme/status-tint-contrast.test.ts` is new and was shown red on
`/contact`'s existing `bg-success/15` badge at 4.48:1 before the fix.

One finding worth carrying: **the cinematic loader error was not a status
colour.** It sits on `bg-media`, near-black in both themes, and no coloured
token in this palette clears AA on it in the light theme - `--destructive-strong`
3.13:1, `--warning` 3.43:1, `--success` 3.30:1 - because every coloured token is
darkened *for* light while that surface stays near-black. `text-on-media` is the
answer, at 21:1. That is S71's rule again: measure what the new case is made of
instead of copying the shape that worked next door.

## 3. What is left, in order

1. **The browser layer for `contact-form.tsx`.** Not started. The brief's
   warning stands and is the sharpest thing in it: both literal sites were on
   states that are **not on screen at rest** - a success message after a real
   submission, and validation lines behind a `touched` flag. `curl` the page and
   confirm the element is in the HTML before writing any assertion. A dev server
   was started and `/contact` was confirmed responding, but **nothing was
   curled and no assertion was written** - that is where the budget ran out.
   The cheap, honest proof is a *driven* state, not a route scan: on `/contact`,
   press Continue with no topic chosen and the `text-destructive-strong` line
   renders. The success panel needs a real submission, so prefer the unit
   measurement that already covers it.
   Note that **no new token was added this sprint**, so the S67 "does the class
   actually paint" claim is already held for every utility used here by the
   existing `@theme inline` assertions. Say so rather than re-proving it.
2. **The four retro items from section 4 of the original brief.** None done.
   Item 1 (`ALLOW_COMMIT_ON_MAIN` disarming `refusalForPaths` as well) was read
   and is confirmed: `scripts/lib/branch-guard.mjs` has one `OVERRIDE` constant
   consulted by both `refusalFor` and `refusalForPaths`, and the second doc
   comment even says so out loud. Give the path rule its own override; the
   branch rule's name is the one that is accurate.
3. **`pnpm arch`, integration, smoke, seo, axe, `pnpm build`.** None run. Stop
   any dev server first: `pnpm build` fails `EPERM` while one holds
   `query_engine-windows.dll.node`, which is retro item 2 and still is not in
   `troubleshooting.md`.
4. **`pnpm facts` and the re-export.** Unit moved 1913 -> 1934 (two new test
   files), so the eight fact-drawing exports are stale and `export-freshness`
   will name them. Regenerate **after** the last test file is added, not before.
   This is the expensive step; budget for it.
5. **The ledger row, the What's New entry and the next-session block.** S72's row
   goes in `docs/sprint-ledger.md` now, not `next-steps.md` - two sentences and
   a SHA, which is the convention the split exists to enforce. The snapshot in
   `next-steps.md` must name S72 once the row lands, or
   `changelog-coverage` goes red naming S71.
6. **One PR, one push.** Still no standalone closeout PR.

## 4. The next sprint's candidate, measured

`--accent-teal` read as text on a tint mixed from itself. Swept and measured
while picking this sprint's alphas: **144 failing measurements across 32
files**, light theme almost exclusively. `bg-accent-teal/10` fails only on
`--muted` (4.20:1), `/12` fails on `--background` (4.43:1) and `--muted`
(4.08:1), `/15` fails on all five surfaces, worst **3.92:1**. Buyer-facing
files among them: `offer-list.tsx`, `account-menu.tsx`, `mobile-nav.tsx`,
`offer-banner.tsx`, `category-disclosure.tsx`, `contact-channels.tsx` and the
docs filters; the rest is admin.

It was deliberately **not** shipped with this sprint, for the reason S71 gave
for not sweeping 130 literals at once: it is either a 144-site migration or a
32-file ratchet, and either belongs in its own diff rather than beside a token
design. Two things a future sprint should know before starting:

- A general pair sweep must respect variant prefixes on the fill. The naive
  version measured the three shadcn menus' `dark:...bg-destructive/20` against
  the **light** theme and reported a 4.09:1 that is never painted -
  `destructive-contrast.test.ts` already handles this correctly and is the model
  to copy. `status-tint-contrast.test.ts` carries the prefix handling too.
- A static sweep cannot know which surface a site is drawn on, which is S66's
  recorded lesson. Holding every site to all five surfaces is conservative and
  will report ratios on surfaces that are never painted; the alternative is
  being silent. This sprint resolved that by *changing the alpha* rather than
  writing an exemption, and that scales badly past a handful of sites.

## 5. Session cost, since it decided this handoff

The sprint was stopped by budget, not by a blocker. `pnpm clean` and
`pnpm health` have **not** been run and step 7 is owed. A dev server was started
during the sprint; confirm port 3000 is free before building.
