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

- `main` is at S75: PR #241, merge SHA `PENDING` until the squash lands (fill it
  from `git log --oneline -1 origin/main` in the next sprint - and the ledger's
  own guard now asks for it). S74's SHA is filled in: `a89a1a5`. S74 added
  `--info` and could prove its *value* but not that `text-info` paints it; a
  probe on the served page now shows the S67 failure for real - `text-info`
  painting `rgb(11,11,11)`, the inherited `--foreground`, while `--info` still
  resolved `rgb(0,102,166)`. PR #241 is the full account.
- **Green on S75's tree:** tsc, lint, `pnpm arch` (no regressions), unit 1967,
  integration 83, smoke 33, seo 19, axe 51, `pnpm facts`, and all 73
  exports re-rendered. Those are the run numbers; the snapshot records the
  `--list` convention (smoke 32, seo 18, axe 50) and both are right -
  sprint-workflow step 3 has the reason.
- **Architecture metrics, stable:** `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`.
- **The paint guard checks 21 colours, not one, and its list is derived from the
  palette rather than from the bridges.** `qa/config/theme-utilities.ts`
  intersects the `:root` oklch colours with the bare `text-<token>` classes in
  the app's markup, so a token added next sprint is covered without anyone
  adding it. Deriving from `@theme inline` instead would have been the quiet
  guard: that is the set that vanishes when a bridge is deleted.
- **`--info` is admin-only and the probe says so.** `curl /admin` returns 307 to
  `/sign-in?redirect=%2Fadmin` and there is no admin-authenticated Playwright
  project, so the real element is unreachable without a secrets gate. The probe
  answers the stylesheet question and nothing about an admin page's layout.
- **The ledger's own two cells now report a placeholder instead of exempting
  it.** `missingChangelogSprints` treated an unparseable PR cell as "nothing to
  check"; `missingLedgerShas` is new and names any merged row above the floor
  whose SHA was never filled in, the newest row excepted because a PR cannot
  record its own squash commit.
- Template handover is the active posture (`docs/template-handover.md`), not
  in-repo production go-live.

### Next session starts here

Paste nothing. A fresh terminal reads this block and begins.

- **Read the newest brief in `docs/hand-off/`.** That file is the next session's
  prompt and it carries the scope, the measurements already taken and the
  corrections owed. It is written as part of the sprint's own PR, so it is never
  something to ask a finished session to compose.
- **State.** `main` is at S75 (#241) plus whatever the current sprint adds, and
  S75's own merge SHA is owed in the ledger - a PR cannot record its own squash
  commit, and `missingLedgerShas` will name it the moment a newer row exists.
  The domain follows `main` by itself - do not check it, do not offer to
  promote. Stripe stays in test mode; there is no go-live.
- **Vercel preview builds were ON on PR #241**, and this is the owner's call,
  made twice in one day on resource grounds. Read the live state off the PR
  rather than from any brief, say which state you saw, and do not propose
  changing it either way. Deploy and repo settings remain a gate.
- **One push per sprint where possible.** No standalone docs-only closeout PR:
  the ledger row, the What's New entry, the previous sprint's merge SHA and this
  block all ride in the sprint's own PR. CI runs twice per merge already, so
  every extra push is four runs, not two.
- **The posting is the owner's own job and he is handling it.** Do not open a
  sprint by proposing a post, and do not re-relay the posting calendar at him;
  `/docs/social-launch-kit` and `/docs/social-launch-pack` hold it if he asks.
- **Treat a token, a guard, a count or a proposed fix you are about to adopt at
  face value as evidence you have not measured yet.** S71 handed over a token
  and a shape that were both wrong; S73's handoff carried 144 failures where the
  sweep found 114; S74's carried "nobody has measured how many fail" and the
  answer was 35 of 49. S75 re-measured the one table its brief *did* carry and
  it reproduced exactly - which is the same discipline, not a reason to skip it
  next time.
- **A guard's candidate list must come from the side that survives the bug.** A
  sweep over `@theme inline` would have tested `--info` until the moment someone
  deleted its bridge, and then tested nothing and passed. Ask what the failure
  deletes before deciding what the guard enumerates. Same shape as S74's canary
  reaching zero and S63's allow-list.
- **An unparseable cell is a failure, not an exemption.** `row.prs.length === 0`
  read as "nothing to check" for twelve sprints, on exactly the rows whose
  record of themselves was broken. When a guard skips a case, ask whether the
  skip describes something fine or something unknown.
- **Assert the element; never probe for it - but say so when you cannot.** Where
  the real element is unreachable (admin behind the proxy), a probe is honest
  only if the spec states what it does not cover, the way
  `destructive-contrast.spec.ts` and the new spec both do.
- **A spec cannot import `qa/config/repo-root.ts`.** Playwright transpiles specs
  to CJS and that module evaluates `import.meta`, which takes `contrast.ts` with
  it. Pass the repo root in, as `theme-utilities.ts` does.
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
