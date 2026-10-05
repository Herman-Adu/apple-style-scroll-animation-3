# Next steps

The programme after the docs work (D1–D6, PRs #84–#89). The full spec is in the
approved plan. This file is the source of truth for **what is on `main`**.

## Current state (synced)

- `main` includes S5 delivery and closeout: PR #129 (`027b39a`) and PR #130 (`0951aec`).
- `main` includes S6 cleanup: PR #131 (`0d9ba3b`) and PR #132 (`2edb520`) for ledger sync and stale-section pruning.
- `main` includes S7 checkpoint: PR #134 (`d006ca1`) for broad refactor sync plus `use-mobile`/`use-toast` store stations.
- `main` includes S8 hook hardening: PR #135 (`5538e10`) for `use-live-refresh` loop extraction with focused unit coverage.
- `main` includes S9 ledger sync: PR #136 (`1daffab`) to align `next-steps` continuity rows for S7/S8.
- `main` includes S10 hook station: PR #137 (`78037f5`) to make `use-active-section` logic testable via pure helper extraction and unit tests.
- `main` includes S11 continuity sync: PR #138 (`2b9af42`) to align ledger status and architecture metrics after S9/S10.
- `main` includes S12 continuity guard: PR #139 (`f8b27e3`) to add explicit continuity tests and keep `next-steps` aligned with merged state.
- `main` includes S13 docs guard batch: PR #140 (`b6f21cc`) adding docs domain API coverage and merged-state continuity assertions.
- `main` includes S14 docs freshness hardening: PR #141 (`5464056`) for `internalDocLinks` edge cases and continuity sync coverage.
- Template handover is the active posture (`docs/template-handover.md`), not in-repo production go-live.
- All required gates were run green for S5 before merge (`tsc`, lint, test, arch, build, smoke, axe).

## Current handoff snapshot (Oct 5, 2026)

- Cleanup pass is complete and validated: `pnpm typecheck`, `pnpm lint`, and `pnpm arch` all pass on the working tree.
- Architecture metrics are currently stable at: `deepImports 0`, `libToFeatures 0`, `routePropDrilling 0`, `useEffect 30`, `anyTypes 0`, `incrementers 3`, `clientComponents 151`, `largeFiles 21`.
- Post-formatter regressions were fixed in strict-typing boundaries and client search sync; no lint or architecture regressions were introduced.

### Ready-to-ship checklist for next station

1. Rebase/branch from real `origin/main` using the protocol in this file.
2. Keep scope narrow to one station outcome (prefer docs/tests/template-quality unless explicitly approved otherwise).
3. Before PR: run `pnpm typecheck`, `pnpm lint`, `pnpm arch`, plus targeted tests for changed areas.
4. Confirm `git diff --stat origin/main` only includes the station’s intended files.
5. After squash merge: verify `main` points to the merge SHA, then update this ledger immediately.

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
5. **Track.** Add a row to the ledger below. Only then start the next sprint from step 1.

> Why step 1 is so strict: after squash merges, the local `origin/main` ref went stale, so new
> branches started from old trees and silently reverted merged files. A plain `git fetch origin main`
> only updates `FETCH_HEAD`, so always use the explicit refspec.

## Sprint ledger

| Sprint | PR       | Merge SHA            | What shipped                                                                                                                             |
| ------ | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Locks  | #83      | `df311b7`            | Lock permissions: owner + named admins, three-layer check                                                                                |
| D1     | #84      | `a0fd4bb`            | Security posture, permissions matrix, email architecture diagrams                                                                        |
| D2     | #85      | `8d06675`            | Engineering quality, decision records, contributing workflow                                                                             |
| D3     | #86      | `b5a1b69`            | Seasonal campaign walkthrough + glossary                                                                                                 |
| D4     | #87      | `899e25e`            | What's new changelog, docs link previews, README overhaul                                                                                |
| D5     | #88      | `8213218`            | Social launch kit, public case study, demo script                                                                                        |
| D6     | #89      | `a8bb019`            | Docs freshness tests, shared palette labels                                                                                              |
| S1     | #91      | `0865f28`            | Owner-managed lock permissions: DB `BlockLocker` + `PermissionAudit`, pure grant rules, owner-only actions                               |
| S2     | #92, #93 | `0f29299`, `2475fbe` | Owner permissions page (optimistic per-admin lock toggle + audit log) and docs/ADR-011 updates                                           |
| S3     | #94      | `3ae0095`            | Demo video tooling: Playwright clip capture, ffmpeg-static MP4/poster pipeline, showcase video script + docs                             |
| S4     | #95      | `c5184b9`            | Social launch assets workflow and generated social deliverables                                                                          |
| S5     | #129     | `027b39a`            | Template handover: `docs/template-handover.md`, README template note, and final architecture-gap closeout                                |
| S5a    | #130     | `0951aec`            | Closeout sync: finalized S5 ledger metadata and stamped final `pnpm arch` baseline-vs-now metrics                                        |
| S6     | #131     | `0d9ba3b`            | Ledger cleanup: removed stale placeholders/duplication and aligned next-chat kickoff with template posture                               |
| S6a    | #132     | `2edb520`            | PR cleanup: removed stale `next-steps` sections and replaced them with concise template-mode kickoff/open-work/backlog blocks            |
| S7     | #134     | `d006ca1`            | Broad refactor sync and hook stations: migrated `use-mobile` and `use-toast` to `useSyncExternalStore` with focused unit tests           |
| S8     | #135     | `5538e10`            | Hook hardening: extracted `use-live-refresh` subscription loop into a testable helper with focused unit coverage                         |
| S9     | #136     | `1daffab`            | Continuity docs sync: updated `next-steps` current-state bullets and sprint ledger entries for merged S7/S8                              |
| S10    | #137     | `78037f5`            | Hook hardening: extracted `use-active-section` decision logic into pure helpers with focused unit test coverage                          |
| S11    | #138     | `2b9af42`            | Continuity sync: aligned `next-steps` ledger/state and architecture metrics after merged S9/S10 stations                                 |
| S12    | #139     | `f8b27e3`            | Continuity guards: added explicit merged-state checks and synced `next-steps` with the latest squash-merged sprint                       |
| S13    | #140     | `b6f21cc`            | Docs guard batch: added public docs-domain selector coverage and continuity assertions for merged-state tracking                         |
| S14    | #141     | `5464056`            | Docs freshness hardening: covered `internalDocLinks` query/hash and asset-extension edge cases, plus continuity sync for merged state    |
| S0     | archived | archived             | Historical placeholder for initial ledger/protocol setup; retained for chronology                                                        |
| SEC1   | #122     | `c6e8b40`            | Guard admin transactional actions; move server-only email/discount exports out of `"use server"` endpoints                               |
| SEC2   | #124     | `3d32053`            | Stabilized auth/session origin handling: Better Auth trusted canonical/proxy host set and checkout return URL pinned to canonical origin |

## Next sprint kickoff (template mode)

Scope: keep this repository as a template and only improve fork-readiness/documentation quality.

1. Orient from real `main` and verify clean state:
   - `git status --short`
   - `git fetch origin +refs/heads/main:refs/remotes/origin/main`
   - `git checkout -B v0/sN-<short-name> origin/main`
2. Pick one narrow template-readiness outcome (docs/tests only unless explicitly approved otherwise).
3. Keep TDD first for any testable behavior and run required gates before PR.
4. Add the shipped row here with PR number + merge SHA immediately after merge.

## Open work (template repo)

- No mandatory in-repo product feature sprint is pending after S6.
- Optional: continue docs quality/consistency sweeps when stale placeholders or duplicated status text appear.
- Any production deployment, Stripe live configuration, or compliance rollout is fork-specific and out of scope here.

## Fork-only backlog (reference)

- Owner-managed lock permissions UI (if the downstream product needs runtime grants without redeploys).
- Demo/showcase media pipeline tweaks (if launch collateral is needed in the downstream fork).
- Production go-live checklist and infra rollout (must be owned by the downstream fork).
