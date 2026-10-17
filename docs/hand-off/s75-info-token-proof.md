# S75 — the one claim S74 could not prove, and the guard that stopped looking

Written at S74's closeout (2026-10-17). This is the next session's prompt: read
it at step 0 of `.agents/skills/sprint-workflow/` together with
`docs/next-steps.md`, and nothing else unless a step asks for it.

## 0. State

- `main` is at S74 (#240). **Its merge SHA is owed in `docs/sprint-ledger.md`**,
  where the row reads `PENDING`: a PR cannot record its own squash commit. Fill
  it from `git log --oneline -1 origin/main` after a fresh fetch, exactly as S74
  did for S73 (`cf30ac4`). That is the only thing S74 leaves in the ledger.
- Counts and metrics are in the snapshot in `docs/next-steps.md`, taken from
  S74's own run. Do not re-quote them from here.
- What S74 shipped: the palette-literals ratchet reached zero. 108 raw Tailwind
  literals in 17 admin and email files moved onto `--success`, `--warning`,
  `--destructive`/`--destructive-strong` and a new `--info`. The ratchet became
  a zero guard with a fixture canary; `--info` is documented in
  `app/globals.css` with its measurements and held by
  `qa/unit/theme/muted-text-contrast.test.ts` and `status-tint-contrast.test.ts`.
- Vercel preview builds: the owner set this twice in one day on 17 Oct, in both
  directions, on resource grounds. **Read the live state off the PR, say which
  state you saw, and do not propose changing it either way.** Deploy and repo
  settings remain a gate.
- Stripe stays in test mode, the domain follows `main` by itself, and the
  posting is the owner's own job. Do not open the sprint by proposing any of
  the three.

## 1. The candidate: `text-info` has never been seen to paint

S67 established that a new palette token owes **two** claims - the value,
modelled, and that the class it is reached through actually paints it, which
only a browser can answer, because a missing `@theme inline` line leaves the
utility matching nothing and the text silently inheriting `--foreground` *while
every static guard stays green, since the stylesheet is correct*.

S74 discharged the first claim by measurement and the second only **statically**:
`muted-text-contrast.test.ts` asserts `--color-info: var(--info);` is present in
the `@theme inline` block, and that assertion was red before the line was added
and green after. That is the exact mechanism S67 found, so it is not nothing -
but it is a guard reading the stylesheet, which is the layer S67 warned is not
the surface.

**Why it was left.** `--info` renders only on admin and email surfaces. There is
no admin-authenticated Playwright project - `qa/config/playwright.config.mts`
has `app-identity` plus one `chromium` project, and `qa/smoke/admin-guard.spec.ts`
asserts the redirect rather than signing in. The repo's admin sessions are
`pnpm` scripts for the showcase pipeline, not test fixtures, and hand-rolling a
Playwright login for this would be the wrong shape.

Two routes, and the choice is the sprint's first decision:

- **Mount a probe on a public route**, the way `qa/axe/destructive-contrast.spec.ts`
  already does for the "Sold out" tag that never renders. Cheapest, reuses an
  existing file, and proves precisely the S67 mechanism. It does not prove any
  admin page renders correctly - and S67's probe has the same limit, which that
  file says out loud.
- **Give the browser suite an admin session.** Bigger, unlocks every admin
  surface for axe for the first time, and `troubleshooting.md` already records
  what it needs: `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` under Vars, which is a
  **secrets gate - the owner adds them, never ask for a value in chat.** Read
  that entry (the "Admin routes are gated by the proxy" one) before proposing it.

**Measure before adopting either.** `curl` an admin route first and see what the
proxy actually returns, and check whether anything public reaches `text-info` at
all - if something does, the probe argument weakens and the real element wins,
which is the S73 rule.

## 2. The guard that stopped looking, carried over unverified

S74's own handoff recorded this and **S74 did not verify it on this tree**, so
treat it as a claim: `missingChangelogSprints` exempts any ledger row where
`row.prs.length === 0`, so a `#PR` placeholder or a typo in the PR cell reads as
"nothing to check" rather than as a problem. The measurement S73 reported, on a
fixture ledger with floor 38 against a changelog mentioning nothing:

| PR cell | parsed PRs | reported missing |
|---|---|---|
| `#239` | `["#239"]` | 1 |
| `#PR` | `[]` | **0** |
| `TBD` | `[]` | **0** |

This is the S63 allow-list shape - a guard quiet because it stopped looking -
and the fix is small: a row at or above the floor with no parseable PR is a
failure, not an exemption. It wants a case lifted from the real ledger for the
rows that must still pass (`S2` carries two PRs; `Locks` and `SEC1` are below
the floor). **Re-measure the table before adopting it**: S74 relied on this
guard to check its own What's New entry and never confirmed the hole exists.

Worth doing in the same sprint as §1 if §1 takes the probe route - both are
small. If §1 takes the admin-session route, this is its own diff.

## 3. The canvas helpers, now in five specs and six copies

Unchanged from S74's handoff except that it got slightly worse:
`qa/axe/destructive-contrast.spec.ts` now carries **two** page-side measuring
functions, `measureProbe` and the `measureElementColour` S74 added for the real
low-stock badge. The others are in `qa/axe/accent-tint-contrast.spec.ts`,
`qa/smoke/showcase-brand.spec.ts`, `qa/smoke/about-timeline.spec.ts` and
`qa/smoke/contact-validation.spec.ts`.

Note the constraint before designing the extraction: a function Playwright sends
to the page **must close over nothing**, so it cannot be a plain import - it has
to arrive as source. A module in `qa/config/` can export `dominantColour`, which
takes `page` and explicit args, but not a probe body. It touches five passing
specs at once, so it wants its own diff.

## 4. What S74 learned that applies here

- **A guard that reaches zero loses the thing that proved it was looking.** The
  ratchet's canary was `found.length > 50` over the app's own markup, which
  cannot survive the count reaching zero: an empty result is what a working
  sweep and a broken regex both return. The canary moved onto a fixture string,
  and both halves were proved - breaking the pattern fails the canary while the
  zero assertion still passes, and one injected literal is named by file and
  line. When closing a ratchet, ask what its new red is before deleting the old.
- **Ask which layer paints it before copying the previous sprint's shape.** S73
  derived `--accent-teal-strong` per scheme because `buildThemeCss` emits the
  accent from `StoreSettings.theme`. S74 checked the same question for `--info`
  and the answer was the opposite: `buildThemeCss` emits only `accent`,
  `accentMuted` and the two gradient fields, so the status palette is not
  client-editable and a static token is correct. Copying S73's shape would have
  derived a token nothing can repaint. The distinction is now in
  `/docs/the-theme-system`.
- **The alpha is part of the colour.** No status token clears AA at `/15` or
  `/20` over `--muted`, so three sites were fixed by lowering the tint rather
  than by changing the colour. A token measured on a page surface says nothing
  about the same token inside a pill tinted from itself.
- **Assert the element where the page really renders it.** S74's low-stock badge
  is measured on the served element, not a probe, because `curl` confirmed
  `/products` renders it (`momo-studio`, "Only 4 left") - unlike the "Sold out"
  tag beside it, which nothing in the catalog produces. Check with `curl`, then
  assert; do not reach for `isVisible().catch(() => false)`.
- **Browser timeouts on this machine are memory, not the code.** The axe run
  failed three light-theme tests on `page.goto` timeouts against `/docs`, all
  navigation and none an assertion, and reproduced identically. That is the
  documented signature in
  `.agents/skills/sprint-workflow/references/troubleshooting.md`: no memory
  headroom, worker count oversubscribes. `PW_WORKERS=1` is the supported
  override; `pnpm health` prints the headroom and names the sessions holding it.
  Run the three browser suites in one `pnpm test:e2e` invocation rather than
  three, because each one starts its own dev server and pays the cold compile.

## 5. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch `v0/s75-<short-name>` off
a freshly fetched `origin/main`. Test first. One PR, one push: S74's merge SHA,
S75's ledger row, its What's New entry and the next-session block all ride in
S75's own PR.

**§1's admin-session route needs a secrets gate (`QA_ADMIN_EMAIL` /
`QA_ADMIN_PASSWORD` in Vars, added by the owner).** The probe route needs no
gate. Nothing else here is waiting on the owner.
