---
name: sprint-workflow
description: Run one sprint end to end on this repo - orient, branch from the real main, hand off to test-first, run every check, open the PR, merge only when green, refresh main and set up the next sprint. Use for "start sprint N", "next sprint", "continue the plan", "where are we", "ship this", "open/merge the PR", "go", after "Pulling changes from main", after a context reset, or when the branch or uncommitted work looks wrong.
---

# Sprint workflow

One sprint = one branch = one PR = one ledger row. Scope comes from the active plan in `v0_plans/`. This skill runs the loop; other skills do the work inside it.

## 0. Orient (every start or resume)

```bash
git status --short && git branch --show-current && git log --oneline -5 && git stash list
```

Read the ledger in `docs/next-steps.md` and the sprint's section of the plan. Tell the user in plain words: last merged sprint + PR, what is next, anything blocked.

Why: the workspace can be switched to a fresh branch from `main` between turns. That wiped uncommitted files in S1.

## 1. Branch from the real main

```bash
git fetch origin +refs/heads/main:refs/remotes/origin/main
git checkout -B v0/<sprint-id>-<short-name> origin/main
```

A plain `git fetch origin main` only moves `FETCH_HEAD`; branching from a stale `origin/main` silently reverts merged work.

## 2. Build, test first

Follow `.agents/skills/test-first/`. While coding, apply only the skills the change touches: `react-next-patterns`, `typescript-clean-code`, `feature-slices`, `db-schema-change`, `better-auth-ops`.

Long sprint? Push work in progress to the sprint branch early (SyncGit / `git push`) so a workspace switch can't lose it.

## 3. Checks (all green before the PR)

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:unit
pnpm test:integration
pnpm test:smoke && pnpm test:axe     # browser tests: always before merge
```

Add `pnpm build` when config, dependencies or deploy are touched. If anything fails, fix it in this sprint and rerun. Never merge red; never skip a check silently. If the sandbox blocks a check, see [troubleshooting](references/troubleshooting.md), make one recovery attempt, then report it as blocked.

## 4. Docs

Update the matching `docs/*.md` and the in-app guide in `features/docs/content/*.ts` (bump `updatedAt`).

## 5. Ship

```bash
git diff --stat origin/main    # only this sprint's files; anything else = stale base, stop and fix
```

1. Commit: `<SPRINT>: <outcome> (<key parts>)`. Push the sprint branch.
2. `gh pr create --base main --title "<SPRINT>: ..." --body` with: what, why, tests run, data impact.
3. Wait for CI to be green (`gh pr checks <n> --watch`). Red = fix on the branch and push again.
4. `gh pr merge <n> --squash --delete-branch`.

## 6. Close out and set up the next sprint

```bash
git fetch origin +refs/heads/main:refs/remotes/origin/main && git log --oneline -1 origin/main
```

Confirm `main` points at the merge commit. Run `.agents/skills/sprint-retro/`. Add the ledger row (it rides with the next sprint's PR). Then go back to step 1 for the next sprint.

## Gates: stop and ask

Production deploy, destructive data or schema changes, repo settings, secrets. Ask, then wait. "ok", "yes and..." or silence is not approval.

## Report

End with: what shipped (PR #), test counts, anything that deviated from the plan and why, what is blocked, and the next sprint with its gate if it has one. Plain language, short.
