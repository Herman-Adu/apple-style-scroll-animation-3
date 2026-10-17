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

- `main` is at S72: PR #238, merge SHA `PENDING` until the squash lands (fill it
  from `git log --oneline -1 origin/main` in the next sprint). 19 raw Tailwind
  palette literals in eight buyer-facing files moved onto tokens measured for
  the surface each is drawn on; the ratchet in
  `qa/unit/theme/palette-literals.test.ts` holds the remaining **108 in 17
  files**, all admin and email. `docs/next-steps.md` was split: the merge
  history lives in `docs/sprint-ledger.md` and this file is 92% shorter.
  PR #238 is the full account.
- **Green on S72's tree:** tsc, lint, `pnpm arch` (no regressions), unit 1933,
  integration 83, smoke 33, seo 19, axe 43, `pnpm build`, `pnpm facts`, and all
  73 exports re-rendered.
- **Architecture metrics, stable:** `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`. Baseline before the R-series: deep
  imports 116, inversions 16, `any` 28, `useEffect` 45.
- **The sprint named above is checked against the newest row in
  `docs/sprint-ledger.md`** by `qa/unit/docs/changelog-coverage.test.ts`, so this
  line cannot fall behind a merge.
- **The merged-PR recount is red by exactly one immediately after a merge**,
  because the snapshot committed in a PR cannot record that PR's own squash
  commit. The fix is the next sprint's first `pnpm facts`, not a change to the
  guard. Every sprint regenerates and commits `lib/facts/snapshot.json`.
- **The browser counts are two numbers, not one stale one.** `pnpm facts` counts
  a spec only when its path contains `smoke/`, `axe/` or `seo/`, and the
  `app-identity` setup project every other project depends on lives in
  `qa/config/setup/`. So a run of 31/19/43 and a snapshot of 30/18/42 are both
  right. Do not "fix" either; the convention is written down in
  `.agents/skills/sprint-workflow/` step 3 since S72.
- Template handover is the active posture (`docs/template-handover.md`), not
  in-repo production go-live.

### Next session starts here

Paste nothing. A fresh terminal reads this block and begins.

- **Read the newest brief in `docs/hand-off/`.** That file is the next session's
  prompt and it carries the scope, the measurements already taken and the
  corrections owed. It is written as part of the sprint's own PR, so it is never
  something to ask a finished session to compose.
- **State.** `main` is at S72 (#238) plus whatever the current sprint adds. The
  counts and metrics above are S72's, and S72's own merge SHA is owed in the
  ledger - a PR cannot record its own squash commit. The domain follows `main` by
  itself - do not check it, do not offer to promote. Stripe stays in test mode;
  there is no go-live.
- **Vercel preview builds are the owner's call and he has made it twice in one
  day.** They were switched off on 17 Oct ("Only build production") and switched
  back on the same day once resource use looked fine. So read the live state off
  the PR rather than from any brief, say which state you saw, and do not propose
  changing it either way. Deploy and repo settings remain a gate.
- **One push per sprint where possible.** No standalone docs-only closeout PR:
  the ledger row, the What's New entry, the previous sprint's merge SHA and this
  block all ride in the sprint's own PR, which is what
  `.agents/skills/sprint-workflow/` step 6 has always said. CI runs twice per
  merge already (`pull_request` and `push: main`), so every extra push is four
  runs, not two.
- **The posting is the owner's own job and he is handling it.** Do not open a
  sprint by proposing a post, and do not re-relay the posting calendar at him;
  `/docs/social-launch-kit` and `/docs/social-launch-pack` hold it if he asks.
- **A scanned route can be the wrong instance of a page type.** `qa/axe` scanned
  "a product detail page" in both themes since before S66 and could never have
  seen S71's defect, because the scanned path is the sitemap's first `/products/`
  URL and that is `momo-x`, the pre-order, where neither amber renders. When a
  page type has instances, walk to the instance that renders the state rather
  than naming a slug an admin can change, and `curl` the page to confirm the
  element is in the HTML before writing any assertion about it.
- **A page's states are part of its coverage, not just its routes.** S72's two
  literal sites on `/contact` were a success panel and validation lines behind a
  `touched` flag - neither on screen at rest, so no scan of that route could
  ever have measured them. Drive the state, and keep the at-rest check beside it
  as the proof the driven one is needed.
- **Treat a token, a guard or a proposed fix you are about to adopt at face
  value as evidence you have not measured yet**, exactly as you would a number.
  S71's handoff handed over a token (`--warning`) and a shape (S67's two-token
  split); both were plausible and both were wrong on the tree.
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
