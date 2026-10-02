# Next steps

The programme after the docs work (D1–D6, PRs #84–#89). The full spec is in the
approved plan. This file is the source of truth for **what is on `main`**.

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

| Sprint | PR | Merge SHA | What shipped |
| --- | --- | --- | --- |
| Locks | #83 | `df311b7` | Lock permissions: owner + named admins, three-layer check |
| D1 | #84 | `a0fd4bb` | Security posture, permissions matrix, email architecture diagrams |
| D2 | #85 | `8d06675` | Engineering quality, decision records, contributing workflow |
| D3 | #86 | `b5a1b69` | Seasonal campaign walkthrough + glossary |
| D4 | #87 | `899e25e` | What's new changelog, docs link previews, README overhaul |
| D5 | #88 | `8213218` | Social launch kit, public case study, demo script |
| D6 | #89 | `a8bb019` | Docs freshness tests, shared palette labels |
| S0 | _this PR_ | _pending_ | This ledger and the sprint protocol |

## Upcoming sprints

| Sprint | Scope |
| --- | --- |
| S1 | Lock permissions in the database: `BlockLocker` + `PermissionAudit` tables, pure grant rules, owner-only actions (TDD) |
| S2 | Admin → Settings → Permissions screen (switch per admin, audit log), docs + ADR-011 |
| S3 | Demo video tooling: Playwright `recordVideo` clips → `.mp4` via `ffmpeg-static` |
| S4 | Social launch assets: LinkedIn carousel PDF + 1080×1080 squares |
| S5 | Production deploy, Stripe live-keys checklist, final gap analysis |
| W1 (#96) | Rules in the repo: `AGENTS.md` router + 11 skills in `.agents/skills/`, guard test `qa/unit/meta/skills.test.ts` |
| W1b (#97) | Feature-slices rule (100% slices, atomic only for `components/ui`), loader contrast fix, vendored grill-me / grill-with-docs (MIT) |
| W2 (#98, #100) | Strict checks: 0 lint errors, no ignored TS build errors, arch-audit ratchet, CI (`checks` + `app`) live and required on `main` |
| W3 (#99) | Architecture health baseline `docs/architecture-health.md` + R1–R7 refactor roadmap (docs only) |
| R1 (#101) | Shared test fakes `qa/fakes/` (db, cache, auth, email, http); integration tests migrated, guard test blocks direct `vi.mock` of those services |
| R2 | Deterministic email template block ids, pure `tallySendResults`, `uniqueSlug` without counters, duplicate `use-toast`/`use-mobile` removed; incrementers 8 → 3 |

## Idea notes

### 1. Owner-managed lock permissions (admin UI)

**Today:** locking email blocks is limited to the owner plus emails in the server-only
`EMAIL_BLOCK_LOCKERS` variable (`lib/auth/permissions.ts`). That variable is not set, so in
practice only the owner can lock, and granting another admin means a redeploy.

**Proposal:** move the locker list into the database and add an **Admin → Settings → Permissions**
screen. The owner can't be removed, every grant and revoke is audited, and the env var stays as a
seed and fallback. The proxy, server actions and UI keep the same three-layer check from #83.

### 2. Demo video, recorded from the sandbox

Playwright `recordVideo` captures `.webm` without a screen recorder. Clip A covers the storefront
(scroll, product, cart, checkout) and Clip B the admin (seasonal starter, edit, lock, preview).
`ffmpeg-static` converts the clips to H.264 `.mp4` for LinkedIn, Facebook and Telegram, with output
in `public/showcase/video/`.

### 3. Go live properly

Deploy current `main` to production (`momo-audio.adudev.co.uk`). Stripe is still on test keys, so
posts say "demo build" until the keys are swapped.

### 4. Social launch assets

A LinkedIn carousel PDF from the showcase screenshots and case study, plus 1080×1080 squares for
Facebook and Telegram.
