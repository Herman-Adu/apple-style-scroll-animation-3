# Next steps

The source of truth for **what is on `main`** and what the next session does.
Every fresh terminal reads this file at step 0 of
`.agents/skills/sprint-workflow/`, so it is kept short on purpose: the merge
history, the kickoff notes and the sprint candidates live in
`docs/sprint-ledger.md` and are read only when a past sprint comes up. S72 split
them; `qa/unit/docs/ledger-split.test.ts` holds the size of this file.

**One sprint is described in four places, not five.** The PR body is canonical
and detailed. The ledger row is two sentences and a SHA. What's New is one
customer-facing line. The handoff brief in `docs/hand-off/` is the next
session's prompt. Nothing else needs to restate a sprint.

## Current handoff snapshot (Oct 17, 2026)

- `main` is at S74: PR #240, merge SHA `PENDING` until the squash lands (fill it
  from `git log --oneline -1 origin/main` in the next sprint). S73's SHA is
  filled in: `cf30ac4`. The palette-literals ratchet reached **zero**: the 108
  raw Tailwind literals in 17 admin and email files moved onto `--success`,
  `--warning`, `--destructive`/`--destructive-strong` and a new `--info`. The
  sweep that preceded it measured **35 of the 49 text sites under AA on light,
  worst 1.44:1**, and every one of the 14 that passed was a `dark:` half. PR
  #240 is the full account.
- **Green on S74's tree:** tsc, lint, `pnpm arch` (no regressions), unit 1950,
  integration 83, smoke 33, seo 19, axe 49, `pnpm facts`, and all 73 exports
  re-rendered. Those are the run numbers; the snapshot records the `--list`
  convention (smoke 32, seo 18, axe 48) and both are right - sprint-workflow
  step 3 has the reason.
- **Architecture metrics, stable:** `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`.
- **`--info` is static, and that was measured rather than assumed.**
  `buildThemeCss` emits only the accent and gradient fields, so no client theme
  can repaint the status palette and S73's "derive it" shape does not apply.
  The two layers are now written down in `/docs/the-theme-system`.
- **`/10` is the ceiling for a status tint.** All three of `--success`,
  `--warning` and `--info` fail AA at `/15` and `/20` over `--muted`, so three
  sites that asked for those alphas had the alpha lowered instead of the colour
  changed. `--destructive` has `/12`, which its own guard already models.
- Template handover is the active posture (`docs/template-handover.md`), not
  in-repo production go-live.

### Next session starts here

Paste nothing. A fresh terminal reads this block and begins.

- **Read the newest brief in `docs/hand-off/`.** That file is the next session's
  prompt and it carries the scope, the measurements already taken and the
  corrections owed. It is written as part of the sprint's own PR, so it is never
  something to ask a finished session to compose.
- **State.** `main` is at S74 (#240) plus whatever the current sprint adds, and
  S74's own merge SHA is owed in the ledger - a PR cannot record its own squash
  commit. The domain follows `main` by itself - do not check it, do not offer to
  promote. Stripe stays in test mode; there is no go-live.
- **Vercel preview builds are the owner's call and he has made it twice in one
  day.** Read the live state off the PR rather than from any brief, say which
  state you saw, and do not propose changing it either way. Deploy and repo
  settings remain a gate.
- **One push per sprint where possible.** No standalone docs-only closeout PR:
  the ledger row, the What's New entry, the previous sprint's merge SHA and this
  block all ride in the sprint's own PR. CI runs twice per merge already, so
  every extra push is four runs, not two.
- **The posting is the owner's own job and he is handling it.** Do not open a
  sprint by proposing a post, and do not re-relay the posting calendar at him;
  `/docs/social-launch-kit` and `/docs/social-launch-pack` hold it if he asks.
- **Treat a token, a guard, a count or a proposed fix you are about to adopt at
  face value as evidence you have not measured yet.** S71 handed over a token
  and a shape that were both wrong on the tree; S73's handoff carried 144
  failures where the sweep found 114; S74's carried "108, nobody has measured
  how many fail" and the answer was 35 of 49 text sites. The repo's own
  precedent is a claim too - S73 looked settled because S72 had just fixed the
  same pattern by lowering an alpha, and measuring first showed no alpha worked.
  Measure the constraint, then pick the shape.
- **A guard that reaches zero loses the thing that proved it was looking.** The
  literals ratchet's canary was `found.length > 50`, which cannot survive the
  count reaching zero: an empty result is what a working sweep and a broken
  regex both return. S74 moved the canary onto a fixture string and proved both
  halves - a broken pattern fails the canary while the zero assertion still
  passes, and one injected literal is named by file and line. When a ratchet is
  closed, ask what its new red is before deleting the old one.
- **A margin you did not measure is not a margin, and the alpha is part of the
  colour.** A token that clears AA on a page surface can fail inside a pill
  tinted from itself, which is why `/15` and `/20` were unavailable to every
  status colour here. Measure the composite the markup actually asks for.
- **Assert the element; never probe for it.** An `isVisible().catch(() => false)`
  reports green while measuring nothing (S73). Where the page really renders the
  thing, assert it: S74's low-stock badge is measured on the served element,
  confirmed by `curl` first, because `/products` does carry a low-stock product
  even though nothing in it is sold out.
- **At the end of the sprint,** rewrite this block and the snapshot above as
  part of the closeout, in the sprint's own PR, and write the next brief into
  `docs/hand-off/`.

## Sprint protocol (every sprint, no exceptions)

1. **Start from the real main.** `git fetch origin +refs/heads/main:refs/remotes/origin/main`, then check that
   `git rev-parse origin/main` equals `gh api repos/Herman-Adu/apple-style-scroll-animation-3/commits/main --jq .sha`.
   Branch with `git checkout -B v0/sN-<name> origin/main && git reset --hard origin/main`.
   Confirm `git status` is clean and the previous sprint's files exist.
2. **TDD.** Write the failing test first (unit for pure rules, integration for actions and repos,
   Playwright for UI), see it fail, implement to green, then refactor.
3. **Gate before the PR.** `pnpm exec tsc --noEmit`, `pnpm test`, the relevant Playwright project,
   and `git diff --stat origin/main` shows **only** this sprint's files. That last check catches accidental reverts.
4. **Ship.** Commit, `gh pr create`, squash-merge, then confirm with `gh pr view N --json state,mergeCommit`
   and `gh api .../commits/main` that main moved to the merge commit.
5. **Track.** Add a two-sentence row to `docs/sprint-ledger.md`. Only then start the next sprint from step 1.

> Why step 1 is so strict: after squash merges, the local `origin/main` ref went stale, so new
> branches started from old trees and silently reverted merged files. A plain `git fetch origin main`
> only updates `FETCH_HEAD`, so always use the explicit refspec.

## Open work (template repo)

- No mandatory in-repo product feature sprint is pending after S6.
- Optional: continue docs quality/consistency sweeps when stale placeholders or duplicated status text appear.
- Any production deployment, Stripe live configuration, or compliance rollout is fork-specific and out of scope here.

## Fork-only backlog (reference)

- Owner-managed lock permissions UI (if the downstream product needs runtime grants without redeploys).
- Demo/showcase media pipeline tweaks (if launch collateral is needed in the downstream fork).
- Production go-live checklist and infra rollout (must be owned by the downstream fork).
