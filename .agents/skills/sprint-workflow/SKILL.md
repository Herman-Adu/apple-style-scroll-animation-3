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

**A handoff is a claim; the repo and `gh` decide.** When a prompt, a summary or a session note disagrees with `git log` and `gh pr view`, the repo wins: say which parts are already done and re-plan from there. The S50 handoff asked for a CI re-run and a merge of PR #191 that had merged two sprints earlier, with its ledger row already on `main`.

**A plan's measurements are claims too.** Count the prose yourself with a script before acting on a number in the plan. A `grep` of `features/docs/content/` truncates its output: post copy lives in one-line template strings, so a line with several claims on it shows one - that is how S56's audit found four of the six "four audiences" claims and missed two, and only an enumerating script found the rest. And when a stated number turns out to be *right*, the fix is a test that pins it, not a rewrite of a true sentence: S56's plan called the "8-slide carousel" sentence false, and it described the one carousel that really is eight.

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
pnpm arch                            # the ratchet CI runs; absent from this list until S61
pnpm test:unit
pnpm test:integration
pnpm test:smoke && pnpm test:axe     # browser tests: always before merge
```

**A guard is not green until it has been red on the real files.** Remove what it demands and watch it fail *naming that thing*: in S51 the changelog guard passed with the new entry deleted, because the same PR number was still in the doc's summary. Do it on committed work - `git checkout -- <file>` to undo the experiment also deletes any uncommitted edit in that file, which is how S51's closeout lost its changelog row and had to redo it. A guard that reads the repo's own prose needs the other half as well: the cases it must *allow* are lines lifted from the repo, not invented ones. S52's first design counted any line carrying a command as an instruction, which would have failed the S51 ledger row - a single line that names `--workers` in one span and `pnpm health` in another. An invented allow case would have agreed with the bug. The phrase a guard *demands* is lifted from the repo too, or written in the same change: in S59 two anchors were wrong rather than the copy being missing - `autoscal` can never match `autoscaling` under a word-boundary rule, and `standard Postgres` was invented, which nearly bought a sentence of public copy written to satisfy a test rather than a reader. **A guard that *measures* has to be shown measuring the right thing, not merely failing.** S60's pixel guard samples a band across the About timeline's progress line, and its first draft passed against the unfixed 1px line because the icon nodes are circles in the same teal centred on the same column: the band had landed on one and was reading the decoy at full strength. Print the value the guard measured and confirm it is the thing you meant before trusting either colour.

**Every sprint runs `pnpm facts` and commits `lib/facts/snapshot.json`.** The
browser gate recounts it: merged PRs from `git log`, `tests.unit` from a real run
of `qa/unit`, the browser layers from a Playwright `--list`. Immediately after any
merge the merged-PR recount is red by exactly one - the snapshot committed in a PR
cannot record that PR's own squash commit - so a branch cut from a fresh `main`
starts one behind and `pnpm facts` is what clears it. That is the guard working,
not a bug in it; S54 proved it on `main`. Adding or removing a spec in `qa/smoke`,
`qa/axe` or `qa/seo` also changes the counts the snapshot records, so regenerate
*after* the test is written, and commit the two together. **A new source file
moves the unit count too**, because `qa/unit/meta/lib-roles` and
`folder-layout` assert once per file: S61 split one module in two and the unit
count moved 1672 to 1674 after `pnpm facts` had already been run and committed,
so the browser gate would have failed on a snapshot that was correct an hour
earlier. Regenerate after the last file is added, not after the last test.

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

Confirm `main` points at the merge commit. **Prove here whatever could only be proved here.** A hook, a CI workflow or an installed config does not take effect until it is on `main`, so a branch can only show it is wired, never that it works - S53 could prove git ran the hook, but not that `main` refused a commit, until after the merge. Do it before the ledger row, and fix what fails in the same sprint. Run `.agents/skills/sprint-retro/`. Add the ledger row (it rides with the next sprint's PR). Then go back to step 1 for the next sprint.

## 7. Leave the machine as you found it

```bash
pnpm clean     # delete regenerable build and test output
pnpm health    # free memory, leftover output, Claude Code sessions still running
```

`clean` only touches an allow-list, so it cannot take the fact snapshot in `.generated` with it. `health` changes nothing.

Act on what `health` reports. It cannot tell an abandoned Claude Code session from a busy one, so close the ones you are finished with from their own window, or `taskkill /PID <pid> /T /F` after checking which is which — never from a script. Low memory is the cause of smoke timing out at the default worker count; [troubleshooting](references/troubleshooting.md) has the detail.

Why this is a step and not a habit: a sprint can pass every gate with a clean `git status` on a machine carrying 289 MB of gitignored output and eight finished sessions, and nothing in the repo would say so.

## Gates: stop and ask

Production deploy, destructive data or schema changes, repo settings, secrets. Ask, then wait. "ok", "yes and..." or silence is not approval.

## Report

End with: what shipped (PR #), test counts, anything that deviated from the plan and why, what is blocked, and the next sprint with its gate if it has one. Plain language, short.
