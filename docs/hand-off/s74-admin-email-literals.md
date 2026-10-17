# S74 — the 108 palette literals left in admin and email

Written at S73's closeout (2026-10-17). This is the next session's prompt: read
it at step 0 of `.agents/skills/sprint-workflow/` together with
`docs/next-steps.md`, and nothing else unless a step asks for it.

## 0. State

- `main` is at S73 (#239). **Its merge SHA is owed in `docs/sprint-ledger.md`**,
  where the row reads `PENDING`: a PR cannot record its own squash commit. Fill
  it from `git log --oneline -1 origin/main` after a fresh fetch, exactly as S73
  did for S72 (`ed6d9a5`). That is the only thing S73 leaves in the ledger.
- Green on S73's tree: tsc, lint, `pnpm arch` (no regressions), unit **1949**,
  integration **83**, smoke **33**, seo **19**, axe **47**, `pnpm build`,
  `pnpm facts`, all 73 exports re-rendered. The snapshot records the `--list`
  convention (smoke 32, seo 18, axe 46); both numbers are right and the
  difference is written down in sprint-workflow step 3.
- Architecture metrics unmoved: `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`.
- What S73 shipped: `--accent-teal-strong`, the accent's text role, derived per
  scheme by `accentStrong()` in `features/settings/lib/domain/theme.ts` and
  emitted by `buildThemeCss`; 52 sites in 28 files moved onto it; guards in
  `qa/unit/theme/accent-tint-contrast.test.ts`, `theme-preset-contrast.test.ts`
  and `qa/axe/accent-tint-contrast.spec.ts`. PR #239 is the full account.
- Vercel preview builds: the owner set this twice in one day on 17 Oct, in both
  directions, on resource grounds. **Read the live state off the PR, say which
  state you saw, and do not propose changing it either way.** Deploy and repo
  settings remain a gate.
- Stripe stays in test mode, the domain follows `main` by itself, and the
  posting is the owner's own job. Do not open the sprint by proposing any of
  the three.

## 1. The candidate, re-measured during S73

The palette-literals ratchet in `qa/unit/theme/palette-literals.test.ts` stands
at **108 in 17 files**, all admin and email. This was verified on S73's tree
rather than carried over: the assertion is `expect(total).toBe(108)`, an exact
equality rather than a ceiling, and it passes. S73's 52-site migration did not
touch it, because `text-accent-teal` was already a token.

These are staff surfaces, which is why three sprints have left them. Two things
make it worth a sprint anyway, and both are arguments to check before adopting:

- The ratchet is **exact**, not a ceiling, so it already fails on an *addition*.
  Its remaining value is therefore mostly as a to-do list, and a to-do list of
  108 items that nobody is working through is a guard earning its keep in name
  only. Either close them or say in the file that admin is deliberately out of
  scope - and if it is the latter, that is a one-line change, not a sprint.
- **Measure before assuming any of them is broken.** S71 recorded this and it
  held again in S72: the listing's low-stock badge is a literal and reads
  10.45:1, because `bg-amber-500/90 text-black` inverts the problem. A sweep of
  the 108 will report sites that are already fine. The count that matters is how
  many *fail*, which nobody has measured.

**These numbers are a claim, including the ones above.** S73's own handoff
carried 144 failing measurements across 32 files; the sweep found **114 across
52 sites in 28 files**, all on light rather than "almost exclusively" light, and
the handoff had missed the `/20` alpha entirely - whose worst case, 3.65:1, was
the worst in the tree. Re-measure before adopting either the count or the fix.

## 2. Two smaller candidates, both real

- **The canvas helpers are now in five specs.** `measureProbe`-style colour
  normalisation through a 1x1 canvas, and `dominantColour` reading a screenshot
  back, are copied into `qa/axe/destructive-contrast.spec.ts`,
  `qa/axe/accent-tint-contrast.spec.ts`, `qa/smoke/showcase-brand.spec.ts`,
  `qa/smoke/about-timeline.spec.ts` and `qa/smoke/contact-validation.spec.ts`.
  S73 added the fifth deliberately rather than half-extracting: the function
  Playwright sends to the page must close over nothing, so the extraction is not
  a plain import and it touches five passing specs at once. It wants its own
  diff. Note the constraint before designing it - a module in `qa/config/` can
  export `dominantColour` (it takes `page` and explicit args) but a probe
  function has to arrive as source.
- **`docs/next-steps.md` is at 144 lines against the 150 in
  `qa/unit/docs/ledger-split.test.ts`.** S73 spent 19 of the 25 lines it
  inherited. The next closeout has six, so something has to come out of the
  "Next session starts here" block, and the right move is to retire the lessons
  that are now enforced by a test rather than to raise the limit. Check which
  ones those are before cutting: a lesson with a guard behind it is safe to
  shorten, a lesson that is only prose is the only copy.

## 3. What S73 learned that applies here

- **The repo's own precedent is a claim, not a shortcut.** S73's shape looked
  settled - S72 had fixed this exact pattern by lowering the alpha one sprint
  earlier - and measuring the constraint first showed that answer was available
  at no alpha at all: light `--accent-teal` has 0.30 of headroom over AA and a
  tint of itself spends all of it. Measure the constraint, then pick the shape.
- **A token the database paints must be derived, not duplicated.**
  `buildThemeCss` emits the accent from `StoreSettings.theme`, so a text role
  frozen in `app/globals.css` is correct for the default theme and silently
  wrong for every client who sets their own: activate Solar Amber and an amber
  chip would carry teal words. No static guard could see it, because the
  stylesheet would be correct. If S74 touches a colour that is measured
  *against* another colour, check which layer paints the other one first.
- **Two components can ship the same utilities, so naming the wrong one measures
  nothing.** S73's browser spec reached for the category filter in
  `doc-category-filter.tsx`; the nav `/docs` renders at rest is the audience
  filter in `docs-explorer.tsx`. Both carry
  `bg-accent-teal/10 text-accent-teal-strong`, so the mismatch was invisible -
  and an `isVisible().catch(() => false)` around it reported green for a whole
  run while asserting nothing. Assert the element; never probe for it. This is
  S71's "wrong instance of a page type" one layer down.
- **A margin you did not measure is not a margin.** The 0.06 drop clears AA to
  `bg-accent-teal/20` and fails at `/21`, and `/20` is exactly the thickest tint
  in the markup. So `accent-tint-contrast` asserts no site asks for more and
  `theme-preset-contrast` asserts every preset survives up to it. If S74 needs a
  thicker tint, that is a palette change measured against all three presets.
- `pnpm build` fails `EPERM` on `query_engine-windows.dll.node` while a dev
  server holds it. S71, S72 and now S73 each lost time to this; stop the server
  first. It is in `.agents/skills/sprint-workflow/references/troubleshooting.md`.

## 4. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch `v0/s74-<short-name>` off
a freshly fetched `origin/main`. Test first. One PR, one push: S73's merge SHA,
S74's ledger row, its What's New entry and the next-session block all ride in
S74's own PR.

**There is no gate on this sprint and nothing is waiting on the owner.**
