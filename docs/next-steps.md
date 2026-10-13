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
- `main` includes S15 continuity ledger sync: PR #142 (`274a9fa`) to keep merged-state guards and sprint ledger aligned for S14 closeout.
- `main` includes S16 continuity ledger sync: PR #143 (`f4124dd`) to keep merged-state guards and sprint ledger aligned for S15 closeout.
- `main` includes S17 to S19: PR #144 (`d30bc71`) ledger sync, PR #145 (`c362c21`) handover post/infographic guidance, PR #146 (`a120fc0`) checkout hydration and Stripe local image origin fix.
- `main` includes S25a to S33b (PRs #153 to #164, latest `96cef04`): back-in-stock alerts, generated facts and coverage ratchet, the recruiter, buyer and engineer packs, the audience clips and the guarded restock clip.
- The R-series (PRs #101 to #121) moved the repo to 100% feature-sliced layout with four-folder `lib/` roles; SEC1 and SEC2 (PRs #122, #124) closed the admin-action and origin gaps. See `docs/architecture.md` and the in-app What's New changelog.
- Template handover is the active posture (`docs/template-handover.md`), not in-repo production go-live.
- All required gates were run green for S5 before merge (`tsc`, lint, test, arch, build, smoke, axe).

## Current handoff snapshot (Oct 13, 2026)

- `main` is at S58: PR #210 merged as `f5bc668`, and **nothing is owed** - this closeout carries S58's own ledger row and What's New entry, so the newest row and the tip of `main` are the same sprint for the first time in five. Rowed and included: S54 (#205, `23bdf12`) with its closeout (#206, `acc83a4`), S56 (#207, `ecde8e6`), S55 (#208, `8b0632e`) which carried S56's owed closeout, S57 (#209, `84c35ac`), and S58 (#210, `f5bc668`). Verified green on this tree: `pnpm typecheck`, `pnpm lint`, `pnpm arch` (no regressions), `pnpm test:unit` (1,620 across 91 files), `pnpm test:integration` (83), `pnpm test:smoke` (27 runs, 26 counted), `pnpm test:axe` (11 runs, 10 counted), `pnpm test:seo` (19 runs, 18 counted).
- **The browser counts are two numbers, not one stale one.** Playwright runs the `app-identity` setup project that every other project depends on; `pnpm facts` counts a spec only when its path contains `smoke/`, `axe/` or `seo/`, and that setup lives in `qa/config/setup/`. So a run of 27/11/19 and a snapshot of 26/10/18 are both right. Do not "fix" either.
- **The merged-PR recount is red by exactly one immediately after a merge**, because the snapshot committed in a PR cannot record that PR's own squash commit. The fix is the next sprint's first `pnpm facts`, not a change to the guard. Every sprint therefore regenerates and commits `lib/facts/snapshot.json`; `.agents/skills/sprint-workflow/` says so in its checks step.
- The sprint named here is checked against the newest row in the ledger below by `qa/unit/docs/changelog-coverage.test.ts`, so this line cannot fall behind a merge again.
- Architecture metrics are currently stable at: `deepImports 0`, `libToFeatures 0`, `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`, `clientComponents 153`, `largeFiles 21`. Baseline before the R-series: deep imports 116, inversions 16, `any` 28, `useEffect` 45.
- S20 (docs and social catch-up) adds the ready-to-post pack `features/docs/content/social-launch-pack*.ts`, a guard that every path named in a doc exists (`qa/unit/docs/doc-paths.test.ts`), and a guard for pack and ledger continuity (`qa/unit/docs/social-launch-pack.test.ts`).
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
| S15    | #142     | `274a9fa`            | Continuity ledger sync: added merged-state guard coverage and updated `next-steps` to include S14 closeout on main                       |
| S16    | #143     | `f4124dd`            | Continuity ledger sync: added merged-state guard coverage and updated `next-steps` to include S15 closeout on main                       |
| S17    | #144     | `d30bc71`            | Continuity ledger sync: guard coverage and `next-steps` updated for S16 closeout on main                                                 |
| S18    | #145     | `c362c21`            | Template handover expanded with post-writing and infographic guidance for forks                                                           |
| S19    | #146     | `a120fc0`            | Fixed checkout hydration and Stripe local image origin handling                                                                          |
| S20    | #147     | `d7fd0f3`            | Docs and social catch-up: 25 stale doc paths fixed, architecture/conventions/changelog updated, recruiter and client launch pack, path and continuity guards |
| S21    | #148     | `985d02a`            | Showcase capture fixes: full-page eased scroll to the footer, burned-in captions, 4:5 and 9:16 output formats                            |
| S22    | #149     | `2237458`            | Showcase demo-data seed and cleanup: tagged, repeatable, dry-run by default, test-first                                                   |
| S23    | #150     | `6886468`            | Showcase clip specs: shot list with caption and discount-code guards, checkout, campaigns, discounts, orders and engineering clips        |
| S24    | #151     | `e46d7aa`            | Showcase infographics: seven stack, architecture, before/after, site map, flow, gates and offer images, with facts pinned to the repo by tests |
| S25    | #152     | `7474749`            | AduDev-branded carousel: orange frame with Momo screenshots left in their own colours, Stripe checkout-to-email flow slide, permissions diagram, QR and email closing slide |
| S25a   | #153     | `e4a143d`            | Troubleshooting: dnf fix for Chromium in the sandbox; S25 ledger entry closed                                                            |
| S26    | #154     | `b6f203f`            | Back-in-stock requests: stock-alerts slice, Notify me form, additive `StockAlert` table                                                  |
| S27    | #155     | `fda99ca`            | Restocking sends the back-in-stock alert once: restock hooks, email template, unsubscribe page                                           |
| S28    | #156     | `c76c575`            | Waiting demand in admin: Waiting column, Most wanted card, readable sold-out tag                                                         |
| W26    | #157     | `4853540`            | Generated facts and coverage ratchet: `pnpm facts`, fact refs on slides, coverage baseline, CI artifact                                  |
| W26b   | #158     | `5f6e11e`            | CI runs `pnpm facts` and keeps `facts.json`; troubleshooting notes                                                                       |
| S29    | #159     | `311cdba`            | New infographic slide kinds (table, bar chart, line chart, sequence) with story format and validators                                    |
| S30    | #160     | `5630b70`            | Recruiter pack: outcome, proof from facts, judgement, worked example, close; pack order validator                                        |
| S31    | #161     | `bc19177`            | Buyer pack: cost slides, self-serve table, demo stock-alert chart, reserved `.test` recipients                                           |
| S32    | #162     | `1f1e403`            | Engineer pack: architecture, three flow sequences, test pyramid, coverage ratchet, diagrams docs page                                    |
| S33    | #163     | `0501f11`            | Audience clips: journey clip (scroll story to admin), seeded demo admin, `showcase:cuts` tooling; restock clip deferred to S33b          |
| S33b   | #164     | `96cef04`            | Restock clip recorded (4:5 + 9:16) with a guarded demo-only restock, admin pages unfrozen in recordings, `--clip` publish flag, restock in buyer cut and calendar |
| S34    | #166     | `0ba687a`            | Recruiter, buyer and engineer cuts rendered (4:5 + 9:16) and embedded in the launch kit; checkout clip signs in first (checkout is now sign-in only) |
| S35    | #168     | `dbc17af`            | Recruiter, buyer and engineer packs plus a checkout step-by-step sequence exported as swipeable LinkedIn PDFs; one page per slide          |
| S36    | #169     | `a16bcdf`            | Security, how-it-was-built and site-tour carousels as LinkedIn PDFs; tour stills taken from the buyer cut                                |
| S37    | #170     | `1b9d727`            | Docs audit: back-in-stock guide, showcase pipeline runbook, What's New, FAQ and checkout sign-in notes, handover and architecture refresh |
| S38    | #172     | `6e679e9`            | Launch kit correctness: load Geist Mono so renders stop depending on the machine, re-render every asset with real facts, correct the buyer cost-line copy; one dev port (3000) with `dev:local` removed |
| S39    | #174     | `37e1bc3`            | Public `showcase-launch-assets` doc for what the template generates; all nine Positioning docs stay owner-gated, now guarded by a test     |
| S40    | #175     | `f321b61`            | Posts quote measured numbers: merged-PR fact, committed `lib/facts/snapshot.json` for live pages, stale 758/140 counts bound to facts |
| S41    | #177     | `8155f9a`            | Recordings pace by distance, not step count: one reading pace per page, a fixed 12s for the canvas hero so all 192 frames render, clock-driven steps; new site-tour and enquiry-form clips, the latter stopping before send |
| S42    | #179     | `9c53663`            | Every real person in a recording is a stand-in, including the store's own contact details; clips refuse to film a broken or gated page; caption placement measured per shot; buyer cut 3:15 to 2:03 |
| S43    | #181     | `4df1468`            | Showcase assets grouped one folder per audience or topic, with the layout defined in one place and pinned by tests; shot-list routes match what the clips film; `text-foreground/40` raised where it failed AA |
| S44    | #183     | `2a32f9f`            | Slides and carousels re-exported from a fresh fact run, so posts quote 1,538 tests / 38.08% lines / 29.06% branches instead of counts three sprints old; first full export since the S43 regroup, every file landed in its group folder unaided |
| S45    | #185     | `a41a4dd`            | A recruitment-first posting calendar as data: four weeks, sixteen slots, every published cut, clip and carousel scheduled exactly once; week one is all hiring proof and LinkedIn takes seven slots; tests fail on an orphaned asset, a missing file, an owner-gated link or buried recruitment |
| S46    | #187     | `3f32d5e`            | Every indexable page points its canonical at itself and carries its own OG and Twitter card titles, via one `pageMetadata()` helper; the SEO suite checks six page types instead of only the home page; the launch kit's `[live URL]` now resolves to the canonical origin |
| S47    | #189     | `3864da7`            | Every carousel slide wears the AduDev brand: both slide types render one shared frame, slide bodies take their accent from a token, the sequence diagram and bar charts were rebuilt, and two guards (source plus rendered pixels) fail on a store-accent colour reaching a slide |
| S48    | #191     | `a2ef81c`            | The site map is derived from the app's own navigation instead of written by hand: four structure slides (overview, storefront, admin, docs) built from the mega-nav, the admin sidebar and the docs taxonomy replace one slide that had drifted to omit About and Contact while listing Checkout and Account; the site-tour carousel is now ten pages, and tests fail when a nav item reaches no slide or a printed path has no route file |
| S49    | #194     | `ee9ff87`            | Resource hygiene became a step instead of a habit: `pnpm clean` deletes regenerable output from an allow-list that protects the fact snapshot, `pnpm health` reports memory, leftover output and running Claude Code sessions without touching them, and sprint-workflow closes out by running both; local Playwright workers are capped at 2 in the gate config, so `pnpm test:smoke` passes 24/24 without the flag everyone had to remember |
| S50    | #196     | `b2eab95`            | What's New caught up and kept that way: eleven entries for S38-S49 close a gap that ran from PR #169 to #187, and a guard parses the sprint ledger in this file so a merged sprint at or after the S38 floor with no changelog entry fails a test; the floor is pinned by a test and the handoff snapshot is now checked against the newest ledger row, which caught it still reading S48 after S49 merged |
| S51    | #199     | `db70f2b`            | Advice can no longer outlive what it describes, and the browser gate checks which app answered: a guard scans what the tooling prints, what agents read and the docs, and fails when any of them advises a flag the config already applies - the `--workers` flag S49 made obsolete, which `pnpm health` was still printing; an `app-identity` Playwright project every other project depends on stopped a smoke run that had reused another repo's dev server on port 3000 and reported 8 passes among 16 failures; and a cold import moved out of a test body, where module loading was being charged to a 20s test timeout |
| S52    | #201     | `1e2bb8a`            | A mention is no longer advice: the stale-advice guard refuses only an occurrence the reader can act on - the flag carrying a value, or the flag inside a command they can copy - judged in the code span holding it, so one line can both name `--workers` and run `pnpm health`; the S51 version matched the bare string and so banned the vocabulary needed to explain itself, leaving the troubleshooting entry that documents the worker cap unable to name the flag it replaced and the S51 ledger row talking around it; the entry now says plainly that passing it by hand is obsolete, nine table-driven cases pin which shapes are refused and which are allowed, and the narrowed guard was proved red again on `scripts/health.mjs`, where the original stale line lived |
| S53    | #203     | `f889bc2`            | The branch rule became a hook instead of a sentence: a tracked `pre-commit` hook refuses a commit on `main`, with the decision as a pure function, a two-line shim around it and `postinstall` pointing `core.hooksPath` at `.githooks/` so a fresh clone is guarded by its first install; detached HEAD is allowed so a rebase or bisect is never blocked and `ALLOW_COMMIT_ON_MAIN` is the deliberate way past, both proved against real `main` after the merge; `.gitattributes` pins the hook to LF because `core.autocrlf` is on here and a CRLF shebang only fails on someone else's machine, and tests assert the tracked mode is 100755 and the `eol` attribute is `lf` |
| S54    | #205     | `23bdf12`            | The fact snapshot can no longer go stale unnoticed: the smoke guard recounts `repo.mergedPrs` and `repo.latestPr` from `git log` and `tests.unit` from a real run of `qa/unit`, through the same functions `pnpm facts` uses, where before it recounted only the browser layers and the unit guards checked the snapshot against itself - which a wrong snapshot also satisfies; the snapshot was stale at 181 PRs and 1,482 unit tests against a real 195 and 1,566, as it had been in S44 and S48. The recount immediately found that CI had been publishing a facts artifact claiming **0** merged PRs ever since S40, because `actions/checkout` fetches a single commit, so the `app` job now asks for `fetch-depth: 0`; and that the guard could pass while the unit suite was red, because the count is of tests that passed, so `numFailedTests` is asserted first |
| S55    | #208     | `8b0632e`            | The profile does the finding, not the posts: the launch pack gained a "Profile and discoverability" section - a headline per angle inside LinkedIn's limit, About copy quoting the fact snapshot rather than typed numbers, a skills list in the order LinkedIn pins and searches, and Open to Work recommended as recruiter-only with the reason recorded, because the public badge is shown to every prospective client and reads as leaving; the `#opentowork` advice in the playbook carries the same caveat, since the hashtag is public in exactly the same way; also carried S56's owed closeout |
| S56    | #207     | `ecde8e6`            | Slide and audience counts come from the artefacts instead of prose: every stated carousel length is compared against the page count inside the committed PDF, read from the bytes two independent ways so a parse failure cannot agree with the claim, and a sweep of `features/docs/content/` fails any slide, page or audience count that no test pins; the audience count was wrong in six places and right in two, so the four were corrected to the five audiences the library actually has, derived from the docs rather than typed in, while the "8-slide carousel" sentence turned out to be true and was pinned instead of rewritten |
| S57    | #209     | `84c35ac`            | The public proof page states the current scale: `/docs/engineering-quality` - the page every recruiter and buyer post links to - opens with the platform's current totals rendered from the committed fact snapshot, where before every checkable number sat behind the owner gate and the only public counts were the email builder's delivery log scoped to PRs #63-#84; both were true, and side by side they read as an inflated claim. The log is pinned rather than rewritten, a sweep fails any public count that is neither measured nor allow-listed history, and the section's assertions read the section's own blocks so the numbers cannot be moved into the summary and the section deleted |
| S58    | #210     | `f5bc668`            | One business case brief to forward: `/showcase/social/business-case/brief.pdf`, eight pages, built through the harness that exports the carousels and assembled from slides the other packs already use, so it cannot drift from them - only the build-buy decision and the replatform-risk pages are new, and each has its row labels bound by a test to the public doc it summarises. A brief is deliberately not a pack: every published `carousel.pdf` must hold exactly one slot in the four-week posting calendar, which is right for a post and wrong for a document sent in a reply, so it publishes as `brief.pdf` while still reusing `packProblems` for page size, slide order and the closing contact page |
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

## Next sprints (added after S34)

Gap found after S34: only the email case study was exported as a swipeable PDF. The recruiter, buyer and engineer packs were exported as loose PNGs, so the sequence slides never reached a postable carousel.

- **S35: Pack carousels and the sequence carousel.** One LinkedIn document PDF per pack (`linkedin-recruiter-carousel.pdf`, `linkedin-buyer-carousel.pdf`, `linkedin-engineer-carousel.pdf`), plus a checkout sequence carousel (`linkedin-checkout-sequence.pdf`) told one step per swipe: cover, pay, total re-checked on the server, Stripe charges once, webhook verified and order saved, email sent, contact slide. Every carousel is listed in the launch kit. Data impact: none.
- **S36: Security, how-it-was-built and site-tour carousels.** Security: three permission layers, merge gates, locked brand blocks, contact. How it was built: test-first sprints, one PR per sprint, green-only merges, coverage ratchet, test-count chart, contact. Site tour: site map plus stills from the S34 recordings, contact. All exported as PDFs and listed in the launch kit. Data impact: none.
- **S37: Docs audit and gap fill.** Audit every feature shipped since S26 against `docs/*.md`, in-app guides, ADRs and glossary. At minimum add a back-in-stock (stock alerts) guide and a showcase pipeline guide (seed, record, cuts, carousels, unseed), refresh the handover doc, and fix stale counts and file lists. Data impact: none. After S37 the owner clears the demo data.

## Next sprints (added after S58) - candidates, none started

The S54-S56 plan in `v0_plans/s54-linkedin-pack-refresh.md` is **fully shipped**:
S54 (#205), S56 (#207), S55 (#208). S57 (#209) and S58 (#210) followed from an
audit of the public CTO layer. Nothing from that plan is outstanding.

Deliberately prose rather than ledger rows: a row in the table above means
merged, and `qa/unit/docs/changelog-coverage.test.ts` would require a What's New
entry for it.

Where the posting push stands: the proof surface is ready. `/docs/engineering-quality`
states the platform's current scale (S57), the profile and discoverability copy
is written and approved (S55), and there is one business case document to
forward (S58). The owner's next move is the social posting itself, which needs
no sprint.

Candidates, in the order they were judged most useful, none started:

- **A gated-to-public drift guard.** The nine owner-gated Positioning docs are the engine room; the eight public `cto` docs (Business Case, Security & Trust, Technology Strategy) are the showroom. Nothing fails when the pitch changes and its public counterpart does not - the same failure mode that let What's New drift for eleven sprints before S50. Model it on `qa/unit/docs/changelog-coverage.test.ts`. Data impact: none.
- **The handover tier matrix.** `pricing-and-packaging-the-build` names three tiers (Launch, Growth, Scale) as a scope ladder, but nothing says what a client actually *receives* at each: docs access, repo access, training, support window, who owns the Stripe and Resend accounts. It is the question that follows "I have read the business case". Note that "handover" means three different things in this repo - the client-facing argument, the packaging tiers, and `docs/template-handover.md` for forking - and they are easy to conflate. Data impact: none.
- **A full showcase re-export.** Every pack's committed PNGs and PDFs still quote their last export's figures; only the S58 brief carries current numbers. Last done wholesale in S44. A large binary diff, so it wants its own sprint. Data impact: none.
- **The Strapi builder direction, on the record.** The owner's stated destination is migrating this commerce product into a full Next + Strapi builder sold as a starter, in a monorepo, aimed at engagement with Strapi developers and companies - the thesis being that no large applications are known to be built on Strapi and Next. A site is already migrated onto it and hosted. None of this is in the repo: `docs/strapi-migration.md` only covers flipping this app's data source via `STRAPI_API_URL` over the existing port/adapter seam, which is a config switch, not a product migration. Wants a backlog entry plus an ADR for the thesis before it has code. Data impact: none.

Excluded on purpose, each its own later sprint: a LinkedIn company-page channel
in `posting-calendar.ts` (needs a `PostingSlot` schema change for owner
amplification), reconciling the two competing posting calendars, `CALENDAR_START`
being in the past, and moving post links to the first comment (investigated and
rejected - no confirmed link penalty, conflicting effect sizes, and the one
consistent signal is that pages absorb it while personal profiles do not).

## Open work (template repo)

- No mandatory in-repo product feature sprint is pending after S6.
- Optional: continue docs quality/consistency sweeps when stale placeholders or duplicated status text appear.
- Any production deployment, Stripe live configuration, or compliance rollout is fork-specific and out of scope here.

## Fork-only backlog (reference)

- Owner-managed lock permissions UI (if the downstream product needs runtime grants without redeploys).
- Demo/showcase media pipeline tweaks (if launch collateral is needed in the downstream fork).
- Production go-live checklist and infra rollout (must be owned by the downstream fork).
