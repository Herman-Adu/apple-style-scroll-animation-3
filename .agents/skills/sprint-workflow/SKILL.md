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

Read `docs/next-steps.md` (current state; the merge history is in `docs/sprint-ledger.md`) and the sprint's section of the plan. Tell the user in plain words: last merged sprint + PR, what is next, anything blocked.

Why: the workspace can be switched to a fresh branch from `main` between turns. That wiped uncommitted files in S1.

**A handoff is a claim; the repo and `gh` decide.** When a prompt, a summary or a session note disagrees with `git log` and `gh pr view`, the repo wins: say which parts are already done and re-plan from there. The S50 handoff asked for a CI re-run and a merge of PR #191 that had merged two sprints earlier, with its ledger row already on `main`.

**A plan's measurements are claims too.** Count the prose yourself with a script before acting on a number in the plan. A `grep` of `features/docs/content/` truncates its output: post copy lives in one-line template strings, so a line with several claims on it shows one - that is how S56's audit found four of the six "four audiences" claims and missed two, and only an enumerating script found the rest. And when a stated number turns out to be *right*, the fix is a test that pins it, not a rewrite of a true sentence: S56's plan called the "8-slide carousel" sentence false, and it described the one carousel that really is eight. **A handoff's proposed *fix* is a claim as well, not only its numbers.** S66 left S67 a one-line instruction - split `--destructive` per theme, "the way every other colour here already is" - and measuring the constraint first showed no per-theme value can work: on dark the text role needs `L >= 0.62` to clear AA and the white label on the fill needs `L <= 0.58`, so the roles had to become two tokens. Two of that handoff's three numbers were also off (dark's worst surface is `--muted` at 4.13:1, not `--background` at 4.41:1, and the tag was already under AA on light at 4.32:1). Measure the constraint before adopting the shape of the fix, or a sprint implements a plan that cannot succeed and only finds out at the gate. **And copy is a claim about the box it goes in.** S68's handoff was agreed in full and marked not-a-draft, and its LinkedIn About still could not be pasted: 4,050 characters against a 2,600 ceiling, which LinkedIn truncates mid-sentence rather than refusing. Every other field fitted, so the only way to know was to measure each field against its own limit before adopting any of it. When one is over, ask what *else* already carries that content before proposing a cut - the owner's answer was to pull a paragraph outright, because Nexgen already had its own Experience entry with its own 2,000-character field, and nothing else then needed rewording. A condensation offered where a deletion was available spends the owner's agreed words on a problem he does not have.

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

**A guard is not green until it has been red on the real files, and a no-op experiment is not a red.** Two of S71's `sed` experiments silently matched nothing, so the guard "passed" while the file was untouched - which proves nothing and reads exactly like a guard that works. Assert the edit changed the file before trusting the result. Then remove what it demands and watch it fail *naming that thing*: in S51 the changelog guard passed with the new entry deleted, because the same PR number was still in the doc's summary. Do it on committed work - `git checkout -- <file>` to undo the experiment also deletes any uncommitted edit in that file, which is how S51's closeout lost its changelog row and had to redo it. A guard that reads the repo's own prose needs the other half as well: the cases it must *allow* are lines lifted from the repo, not invented ones. S52's first design counted any line carrying a command as an instruction, which would have failed the S51 ledger row - a single line that names `--workers` in one span and `pnpm health` in another. An invented allow case would have agreed with the bug. The phrase a guard *demands* is lifted from the repo too, or written in the same change: in S59 two anchors were wrong rather than the copy being missing - `autoscal` can never match `autoscaling` under a word-boundary rule, and `standard Postgres` was invented, which nearly bought a sentence of public copy written to satisfy a test rather than a reader. **A guard that *measures* has to be shown measuring the right thing, not merely failing.** S60's pixel guard samples a band across the About timeline's progress line, and its first draft passed against the unfixed 1px line because the icon nodes are circles in the same teal centred on the same column: the band had landed on one and was reading the decoy at full strength. Print the value the guard measured and confirm it is the thing you meant before trusting either colour. **An allow-list entry is the guard agreeing with the bug.** S63 found twenty `[live URL]` placeholders in copy written to be pasted into LinkedIn, and the pack's placeholder guard had been green through every one of them because `[live URL]` was in its allowed set. Read an allow-list as the list of defects that will never be reported, and keep only entries a reader is meant to act on. **And changing the shape of the text changes which guards can still see it.** The same substitution put a host in front of every `/docs/...` link, which `internalDocLinks` skips the way it skips `features/docs/api`, so the one guard that checks those links exist would have gone quiet on all twenty at the moment they went live. Run the pattern guards against the new shape before the change, not after. **A guard's home is decided by what it would deadlock, not by which layer it feels like.** `pnpm showcase:assets` is `pnpm facts && playwright`, and `scripts/facts.mjs` aborts when Vitest fails, so a unit guard over the committed exports would block the only command that repairs them - which is why S64's export-freshness lives in `qa/smoke`, the same reason facts-freshness does. Ask what command fixes a failure of the guard, and make sure the guard cannot stop it running. **And only a number that is a deterministic function of the repo may gate a committed artefact.** Coverage measures a *run*: CI's Node 24 read 41.91/31.69 from the identical tree this machine read 41.88/31.62 from, and S64's new guard went red on its first CI run for that and nothing else. Record such a number, never compare it. The repo had already drawn this line twice - facts-freshness never recounts coverage, and `floorCoverage` exists so rounding noise cannot fail CI - and S64 walked past both before rediscovering it from a red pipeline. **A phrase a guard demands can be in the file twice.** When a doc renders typed data *and* restates it in prose - which is the shape every doc in `features/docs/content/` that reads `lib/domain/` has - an anchor matches in both, so deleting the prose answer leaves the guard green. That is the S51 bug seen from the other side, and it is not always a fault: in S62 two of four anchors were still true because the table a buyer reads still carried them. Show the red by removing the answer from *both* sides, and if only one side can ever go red, write down which failure the guard actually detects. **A new field in a committed record goes red everywhere at once, and that red is not the proof.** S65 added `sourceHash` to all 73 export records and the guard named all 73 - every one for the same reason, that the field was absent. That proves the field is required and nothing else. The proof that drift is *detected* is the second red: do the work the guard demands first (there, a re-export, which is the only thing allowed to write a record), then break one thing and watch it name that one thing. **And hash what the renderer reads, not the data you happen to have.** The slide shell prints a page number, so S65's hash had to cover each page's position as well as the slide - which is why `exportRenderSlides` is now the single resolution of what an export renders and the render route reads it too. A hash of the slide alone would have stayed silent about the eight standalone PNGs that print their place in the email case-study carousel. **A guard is only as true as the layer it reads, and this app paints from the database.** `buildThemeCss` emits the active template's tokens as a `:root` block after `app/globals.css`, and `StoreSettings.theme` holds a full copy of every installed template - so a store that ever activated a preset froze that palette in its own row. S66 darkened light `--accent-teal` in the stylesheet, in the preset constant and in a token-floor test, went green everywhere, and five routes kept failing axe for an hour because the served page was still painting the old value out of the column. Before trusting any colour guard, curl the page and read the inline `<style>`; the stylesheet is the source, not the surface. **And a guard over tokens cannot see whether the utility exists.** A Tailwind v4 class only exists because `--color-<name>` is declared in `@theme inline`; without that line `text-destructive-strong` matches nothing, the text silently inherits `--foreground`, and every static guard stays green *because the stylesheet is correct*. S67 showed it by deleting the line: the probe came back `rgb(11,11,11)` while the token still resolved `rgb(188,0,0)`. A new palette token therefore owes two claims - the value, modelled; and that the class it is reached through paints it, which only a browser can answer. Measure a token's *rendered alpha* too: the same sprint found the "Sold out" tag below AA at 4.32:1 where the solid colour it names reads 4.56:1, because the markup asks for `bg-destructive/90` and the old guard measured `bg-destructive`. **A phrase a guard demands can also live in a different block from the thing it checks.** S68's Open to Work guard required the word `handover` somewhere in the profile section, and that word was never in the callout it claimed to pin - it was in a headline three fields away, so the guard stayed green on copy that recorded no reason at all. Anchor on phrases lifted from the block under test, and when a guard reads a whole section, delete the answer from the block you mean and watch it fail. **And a guard over paste-ready copy measures the paste, not the render.** `absoluteUrl("")` is `http://localhost:3000` under CI's env and ten characters longer per link on the deployed host, so a length guard reading the rendered string passes copy the owner's own paste truncates: S68's About was shown red at 2,602 where the naive length read 2,592.

**Two browser-test counts are in circulation; say which one you are quoting.** `pnpm facts` counts specs from a Playwright `--list` that excludes the `app-identity` setup project, and `pnpm test:smoke|seo|axe` each print one more because they run it. A ledger row quotes the run output (S71: smoke 31, seo 19, axe 43); `lib/facts/snapshot.json` and the exports carry the `--list` numbers (30, 18, 42). Both are right and neither is a drift - S71 spent a cycle reconciling 39 against 38.

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
earlier. Regenerate after the last file is added, not after the last test. **And moving those counts owes a re-export, even when no showcase file was touched.** Eight of the 73 published exports draw `tests.*` on their face, so a sprint that adds a single spec makes them stale. S66's handoff ruled a re-export out on the grounds that no `features/showcase/` file had changed - which was true, and irrelevant: unit went 1752 to 1826 and axe 11 to 32, and `export-freshness` named all eight. Decide it from the guard, never from the file list.

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
