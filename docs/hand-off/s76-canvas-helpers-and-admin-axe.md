# S76 — the six copies of one page-side function, and the surface no scan has ever reached

Written at S75's closeout (2026-10-17). This is the next session's prompt: read
it at step 0 of `.agents/skills/sprint-workflow/` together with
`docs/next-steps.md`, and nothing else unless a step asks for it.

## 0. State

- `main` is at S75 (#241). **Its merge SHA is owed in `docs/sprint-ledger.md`**,
  where the row reads `PENDING`: a PR cannot record its own squash commit. Fill
  it from `git log --oneline -1 origin/main` after a fresh fetch. Unlike every
  sprint before this one you do not have to remember: `missingLedgerShas` in
  `features/docs/lib/domain/changelog.ts` names any merged row above the floor
  whose SHA cell was never filled, and S75's row stops being the exempt newest
  one the moment S76's row is added. Expect it red, and that is the guard.
- Counts and metrics are in the snapshot in `docs/next-steps.md`, taken from
  S75's own run. Do not re-quote them from here.
- What S75 shipped: the browser half of S67's two-claim rule, for every colour
  the app draws text in rather than for one token. `qa/axe/theme-utilities-paint.spec.ts`
  mounts a probe per colour on `/products` in both themes and compares what
  Chromium painted against the token; `qa/config/theme-utilities.ts` derives the
  21 candidates from the `:root` palette intersected with the app's bare
  `text-<token>` classes; `qa/unit/theme/theme-utilities.test.ts` holds the
  static half. Also both ledger cells: an unparseable PR cell is a failure
  rather than an exemption, and the SHA cell has a guard at all.
- Vercel preview builds were **ON** on PR #241 - a Vercel deployment check ran
  and passed. The owner set this twice in one day on 17 Oct, in both directions,
  on resource grounds. **Read the live state off the PR, say which state you
  saw, and do not propose changing it either way.** Deploy and repo settings
  remain a gate.
- Stripe stays in test mode, the domain follows `main` by itself, and the
  posting is the owner's own job. Do not open the sprint by proposing any of
  the three.

## 1. The candidate: five specs, six copies of the same page-side function

Carried from S74's handoff and still true, now with S75's numbers:

| File | Page-side functions |
|---|---|
| `qa/axe/destructive-contrast.spec.ts` | `measureProbe`, `measureElementColour`, `effectiveOpacity`, `dominantColour` |
| `qa/axe/theme-utilities-paint.spec.ts` | `measureUtilities` |
| `qa/axe/accent-tint-contrast.spec.ts` | its own |
| `qa/smoke/showcase-brand.spec.ts` | its own |
| `qa/smoke/about-timeline.spec.ts` | its own |
| `qa/smoke/contact-validation.spec.ts` | its own |

Every one of them builds the same 1x1 canvas and normalises a colour through
it, because Chromium hands these back in the space they were authored in -
`oklch()` - which a naive `rgb()` regex reads straight past.

**Read the constraint before designing the extraction.** A function Playwright
sends to the page *must close over nothing*: its source is serialised, so a
reference to anything in the spec file arrives `undefined`. That rules out a
plain import for the probe bodies. What a module in `qa/config/` *can* export is
a function taking `page` and explicit arguments - `dominantColour(page, png)`
already has that shape - and a **string** of page-side source that each spec
evaluates. Decide which of the six are the first shape and which are the second
before moving any of them.

**And S75 found a second constraint the extraction has to live with, the hard
way.** A spec cannot import `qa/config/repo-root.ts`: Playwright transpiles
specs to CJS, that module evaluates `import.meta`, and `qa/config/contrast.ts`
imports it, so reaching for the repo's own contrast model from a spec fails at
load with `Cannot use 'import.meta' outside a module`. `theme-utilities.ts`
takes the repo root as an argument for exactly this reason and the neighbouring
specs resolve paths relatively. Whatever new `qa/config/` module this sprint
adds, check it loads under Playwright *and* Vitest before building on it - the
failure is at import time and looks nothing like a test failure.

It touches five passing specs at once, so it wants its own diff, and the proof
it did not break anything is that all three browser suites still pass with the
same counts.

## 2. The surface no scan has ever reached, and the gate it needs

`--info`'s value is modelled and its bridge is now proved in a browser. What is
still true is that **no admin page has ever been scanned by axe**, and S75 made
that measurement rather than inheriting it: `curl /admin` returns `307` to
`/sign-in?redirect=%2Fadmin`, `qa/config/playwright.config.mts` has
`app-identity` plus one `chromium` project, and `qa/smoke/admin-guard.spec.ts`
asserts the redirect rather than signing in. So every admin surface - the order
manager, the product manager, the email campaign list, the theme editor, the
permissions page - is unmeasured for contrast and for accessibility both.

`.agents/skills/sprint-workflow/references/troubleshooting.md` records what it
needs, under "Admin routes are gated by the proxy": `QA_ADMIN_EMAIL` /
`QA_ADMIN_PASSWORD` under Vars. **That is a secrets gate - the owner adds them,
and a value is never asked for in chat.** Nothing else in this brief is waiting
on him, so this is the one item to raise and then leave alone if the answer is
not yet.

If it is granted, the shape is a Playwright setup project like `app-identity`
that signs in once and saves storage state, not a login hand-rolled per spec -
and note that the repo's existing admin sessions are `pnpm` scripts for the
showcase pipeline, which are not test fixtures and should not be bent into
them. The honest first scope is one route, scanned in both themes, with the
project wiring that makes the second route a one-line addition.

## 3. What S75 learned that applies here

- **A guard's candidate list must come from the side that survives the bug.**
  The obvious sweep for "is every colour bridged into Tailwind?" enumerates the
  `@theme inline` block - and that is the set which disappears when a bridge is
  deleted, so the guard would have tested `--info` right up to the moment it
  mattered and then reported nothing, green. Deriving the candidates from the
  `:root` palette and the markup instead means the deletion leaves the demand
  standing: it was shown red on the real stylesheet, naming
  `text-info (features/admin/components/email/campaign-list.tsx) needs
  --color-info: var(--info) in @theme inline`, and the browser half came back
  `text-info painted rgb(11,11,11)` against a token still resolving
  `rgb(0,102,166)`. Ask what the failure deletes before deciding what the guard
  enumerates. Same family as S74's canary reaching zero and S63's allow-list.
- **An unparseable cell is a failure, not an exemption.** `row.prs.length === 0`
  read as "nothing to check" for twelve sprints, on precisely the rows whose
  record of themselves was broken. Re-measured before it was adopted and the
  brief's table reproduced exactly - `#239` reported 1, `#PR` and `TBD` both 0 -
  which is the discipline working, not a reason to skip it next time. When a
  guard skips a case, ask whether the skip describes something fine or something
  unknown.
- **The guard written for one cell was live on the cell beside it.** S74's row
  read `PENDING` the whole time §2 was being written about the PR column. Look
  for the same defect's siblings in the same record before closing the file.
- **A sweep over source cannot tell markup from prose about markup.** `info`
  comes back with three files, not two: the third is the docs page explaining
  that `text-info` is a class. That is not the leak it looks like - Tailwind's
  own scanner reads strings the same way, so the class really is generated - and
  the two agreeing is what makes the guard's question the right one. Check
  whether a sweep's over-reach matches the tool it is modelling before
  narrowing it.
- **Only a browser can answer the bridge question, and a probe must say what it
  does not cover.** The new spec states, as `destructive-contrast.spec.ts` does,
  that it speaks for the served stylesheet and not for any admin page's layout.

## 4. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch `v0/s76-<short-name>` off
a freshly fetched `origin/main`. Test first. One PR, one push: S75's merge SHA,
S76's ledger row, its What's New entry and the next-session block all ride in
S76's own PR.

Run the three browser suites in one `pnpm test:e2e` invocation rather than
three - each starts its own dev server and pays the cold compile. Moving any
test count owes a re-export: S75 moved unit 1950 -> 1967 and axe 48 -> 50, and
`export-freshness` named seven of the 73 exports before `pnpm showcase:assets`
cleared them. Decide that from the guard, never from the file list.

**§2 needs a secrets gate (`QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` in Vars, added
by the owner).** §1 needs no gate.
