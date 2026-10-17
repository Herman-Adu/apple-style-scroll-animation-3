# S73 — `--accent-teal` read as text on a tint of itself

Written at S72's closeout (2026-10-17). This is the next session's prompt: read
it at step 0 of `.agents/skills/sprint-workflow/` together with
`docs/next-steps.md`, and nothing else unless a step asks for it.

## 0. State

- `main` is at S72 (#238). **Its merge SHA is owed in `docs/sprint-ledger.md`**,
  where the row reads `PENDING`: a PR cannot record its own squash commit. Fill
  it from `git log --oneline -1 origin/main` after a fresh fetch, exactly as S72
  did for S71 and S71 did for S70. That is the only thing S72 leaves in the
  ledger.
- Green on S72's tree: tsc, lint, `pnpm arch` (no regressions), unit **1933**,
  integration **83**, smoke **33**, seo **19**, axe **43**, `pnpm build`,
  `pnpm facts`, all 73 exports re-rendered. The snapshot records the `--list`
  convention (smoke 32, seo 18, axe 42); both numbers are right and the
  difference is written down in sprint-workflow step 3.
- Architecture metrics unmoved: `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`.
- The palette-literals ratchet stands at **108 in 17 files**, all admin and
  email. It is not this sprint's scope; it is there when a sprint wants it.
- Vercel preview builds: the owner set this twice in one day on 17 Oct, in both
  directions, on resource grounds. **Read the live state off the PR, say which
  state you saw, and do not propose changing it either way.** Deploy and repo
  settings remain a gate.
- Stripe stays in test mode, the domain follows `main` by itself, and the
  posting is the owner's own job. Do not open the sprint by proposing any of
  the three.

## 1. The candidate, measured during S72

`--accent-teal` used as *text* on a tint mixed from itself. Swept while picking
S72's alphas: **144 failing measurements across 32 files**, light theme almost
exclusively.

- `bg-accent-teal/10` fails only on `--muted` (4.20:1).
- `/12` fails on `--background` (4.43:1) and `--muted` (4.08:1).
- `/15` fails on all five surfaces, worst **3.92:1**.

Buyer-facing among the 32: `offer-list.tsx`, `account-menu.tsx`,
`mobile-nav.tsx`, `offer-banner.tsx`, `category-disclosure.tsx`,
`contact-channels.tsx` and the docs filters. The rest is admin.

It was deliberately held out of S72, for the reason S71 gave for not sweeping
130 literals at once: this is either a 144-site migration or a 32-file ratchet,
and either belongs in its own diff rather than beside a token design.

**These numbers are a claim, including the ones above.** S71's handoff carried
three and two were wrong; S67's carried a *shape* that could not work. Re-measure
before adopting either the count or the fix, and if a number turns out to be
right, pin it with a test rather than rewriting a true sentence.

## 2. Two things to know before starting

- **A pair sweep must respect variant prefixes on the fill.** The naive version
  measured the three shadcn menus' `dark:...bg-destructive/20` against the
  *light* theme and reported a 4.09:1 that is never painted.
  `qa/unit/theme/destructive-contrast.test.ts` handles this correctly and is the
  model to copy; `status-tint-contrast.test.ts` carries the prefix handling too.
- **A static sweep cannot know which surface a site is drawn on** — S66's
  recorded lesson. Holding every site to all five surfaces is conservative and
  reports ratios on surfaces that are never painted; the alternative is silence.
  S72 resolved that by *changing the alpha* rather than writing an exemption,
  and that scales badly past a handful of sites. Decide which of the two shapes
  this sprint is before writing the guard: a migration that moves the sites, or
  a ratchet that counts them and may only fall.

## 3. What S72 learned that applies here

- **A page's states are part of its coverage, not just its routes.** Both of
  `contact-form.tsx`'s literal sites were off screen at rest, so a scan of
  `/contact` would have reported nothing whatever the token said.
  `qa/smoke/contact-validation.spec.ts` drives the state and keeps the at-rest
  check beside it as the proof the driven one is needed. Several of the 32 files
  above are menus and disclosures — **open state, by definition.** Expect the
  same problem and plan for a driven assertion or a unit measurement, not a
  route scan.
- **No new token means no new paint claim.** S67's "does the utility actually
  paint" check is owed only when a sprint adds a `@theme inline` entry. If S73
  adds one — and a `--accent-teal-strong` is the obvious shape if the text role
  and the fill role pull apart the way `--destructive` did in S67 — then it owes
  a browser probe as well as a modelled ratio.
- `curl` the page and read the inline `<style>` before trusting any colour
  guard: `buildThemeCss` emits the active template's tokens after
  `app/globals.css`, so a store that ever activated a preset paints from its own
  database row. That cost S66 an hour.

## 4. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch `v0/s73-<short-name>` off
a freshly fetched `origin/main`. Test first. One PR, one push: S72's merge SHA,
S73's ledger row, its What's New entry and the next-session block all ride in
S73's own PR.

**There is no gate on this sprint and nothing is waiting on the owner.**
