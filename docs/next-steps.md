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

## Current handoff snapshot (Oct 16, 2026)

- `main` is at S68: PR #232, merge SHA `b5dae18`, and **nothing is owed** - this closeout carries S68's own ledger row and What's New entry. S68 landed the profile copy agreed on Oct 16 into the launch pack and found the one thing the handoff had not measured: its About section was 4,050 characters against LinkedIn's 2,600 ceiling. The owner's call was to pull the Nexgen paragraph, which has its own Experience entry, leaving the remaining seven paragraphs at 2,541 with nothing reworded. S67 (#228, `9c0dc27`) is included - this closeout carries S67's own ledger row and What's New entry. S67 split `--destructive`, the last colour in the palette written as one value for both themes. The handoff asked for a per-theme split; measuring the constraint first showed that cannot work, because the token does two opposed jobs and on dark the text role needs `L >= 0.62` while the white label on the fill needs `L <= 0.58`. So the split is by role too: `--destructive` keeps the fill, `--destructive-strong` carries text, and 38 occurrences across 24 files moved. It also found the "Sold out" tag already below AA on light at 4.32:1, because it renders `bg-destructive/90` and the old guard measured the solid colour. S66 (#227, `1403afb`) is included - its row stood at `PENDING` until this sprint's first commit filled it in, and the PR opened as #227, the number that closeout had assumed from the sequence. S65a (#224, `7452797`), S65 (#225, `2c7cb67`) and its closeout (#226, `9be71b1`) are included, as are S64 (#222, `72deeb6`) with its closeout (#223, `322108f`). Verified on this tree: tsc, lint, `pnpm arch` (no regressions), unit 1835, integration 83, smoke 31, seo 19 and axe 37 green across both themes, and all 73 exports re-rendered. The PR opened as #228, the number this closeout had assumed from the sequence, so neither the ledger row nor the What's New row needed correcting.
- **Two docs-only merges sit on top of S67 and carry no ledger row of their own**, the way S65a's closeout did not: S67a (#229, `c4a4627`), and S67b (#230, `be23c06`) which landed three hand-off briefs. The line above still names S67 because `qa/unit/docs/changelog-coverage.test.ts` holds the snapshot's named sprint equal to the newest S-series ledger row, and a docs merge that ships no feature does not earn a row. `main` is at `be23c06`.
- **The product hero direction is decided and written down** (`docs/hand-off/product-hero-sprint.md`). The owner asked whether Momo Beat's hero could match the headphones frame sequence; it can, because `components/scroll/frame-scroll-hero.tsx` is already generic. Measuring it first found that `hero` is one field doing two opposed jobs - `app/page.tsx:20` renders the flagship's *product* hero as the site's front door, so the lure and the per-product section are the same data. The owner then asked the question that settled it: why would every product carry one, at ~48 MB across four products behind four blocking preloads? So it splits by role, the way S67 split `--destructive`: the cinematic stays on the home page, and product pages get one static, data-driven, **server-rendered** hero. `docs/hand-off/momo-beat-frame-hero.md` records the path not taken and is marked superseded - read it for the frame engine's asset contract, do not build from it.
- **The next session's prompt is written here, not asked for.** Asking a finished session to compose a handoff prompt re-reads the whole sprint to produce prose the repo should already hold, and the owner is billed for it twice. The closeout writes "Next session starts here" below; a fresh terminal opens this file and begins. Because S64's closeout was requested as a prompt rather than read from here.
- **The domain follows `main` on its own now, and that is proved rather than assumed. Stop checking it each sprint.** `autoAssignCustomDomains` was false, which is why the domain sat six days behind `main` while every deploy reported success; it was set true on Oct 14 and S63's merge was the first production deploy to exercise it. The deployment built from `01d8ac8` carries `momo-audio.adudev.co.uk` in its alias list, and the `?dpl=` id in the page HTML matched the newest production deployment (`dpl_C3c7rZpMqjTYAardmuwgtP6NPks1`). Merging is deploying again. If a future sprint sees the domain lag, that setting is the first thing to read - and promoting is still a gate.
- **The browser counts are two numbers, not one stale one.** Playwright runs the `app-identity` setup project that every other project depends on; `pnpm facts` counts a spec only when its path contains `smoke/`, `axe/` or `seo/`, and that setup lives in `qa/config/setup/`. So a run of 30/12/19 and a snapshot of 29/11/18 are both right. Do not "fix" either.
- **The merged-PR recount is red by exactly one immediately after a merge**, because the snapshot committed in a PR cannot record that PR's own squash commit. The fix is the next sprint's first `pnpm facts`, not a change to the guard. Every sprint therefore regenerates and commits `lib/facts/snapshot.json`; `.agents/skills/sprint-workflow/` says so in its checks step.
- The sprint named here is checked against the newest row in the ledger below by `qa/unit/docs/changelog-coverage.test.ts`, so this line cannot fall behind a merge again.
- Architecture metrics are currently stable at: `deepImports 0`, `libToFeatures 0`, `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`, `clientComponents 153`, `largeFiles 21`. Baseline before the R-series: deep imports 116, inversions 16, `any` 28, `useEffect` 45.
- S20 (docs and social catch-up) adds the ready-to-post pack `features/docs/content/social-launch-pack*.ts`, a guard that every path named in a doc exists (`qa/unit/docs/doc-paths.test.ts`), and a guard for pack and ledger continuity (`qa/unit/docs/social-launch-pack.test.ts`).
- Post-formatter regressions were fixed in strict-typing boundaries and client search sync; no lint or architecture regressions were introduced.

### Next session starts here

Paste nothing. A fresh terminal reads this block and begins.

- **State.** `main` is at `b5dae18` - S68 (#232), the profile copy sprint, plus
  the docs-only closeout S68a (#233) that carries this block and S68's retro.
  Every gate was green on S68's tree: tsc, lint, `pnpm arch` (no regressions),
  unit 1842, integration 83, smoke 31, seo 19, axe 37, and all 73 exports
  re-rendered because the moved unit count dated seven of them. Nothing is
  owed - S68's ledger row and What's New entry shipped with it and its merge SHA
  is filled in. The domain follows `main` by itself - do not check
  it, do not offer to promote. Stripe stays in test mode; there is no go-live.
- **The first action is not a sprint. It is pasting what S68 produced.**
  `/docs/social-launch-pack` now carries all five profile fields, ready to
  paste and inside the limit of the box each one goes in: the personal headline
  and About under "Profile and discoverability", then the Adu Dev tagline,
  company overview and Facebook short description. The repo cannot do this part
  - LinkedIn has no write access to a personal profile, and the community MCPs
  are scrapers that risk the account, which `docs/hand-off/profile-copy-s68.md`
  section 5 records. Two things in that handoff are still manual and are **not**
  owed by any sprint: the Nexgen **Experience** entry takes his own verbatim
  write-up (confirm the end date is blank so LinkedIn computes the duration),
  and section 4 holds the agreed banner wording.
- **What S68 found, because it is the kind of thing that recurs.** The handoff
  was agreed in full and marked not-a-draft, and its About still could not be
  pasted: 4,050 characters against LinkedIn's 2,600, truncated mid-sentence
  rather than refused. Everything else fitted. **Length is a claim a handoff
  rarely checks**, so measure every field against its own box before adopting
  the copy. The owner resolved it in one line - pull the Nexgen paragraph, which
  has its own Experience entry - and nothing else was reworded.
- **The banner images are finished.** Both LinkedIn banners and the Adu Dev
  company and Facebook covers were generated on Oct 16 and live outside the
  repo in `C:\Users\herma\Documents\kie-generations\banners\`. Do not
  regenerate them. Image-to-image re-renders his face on every run, so a banner
  whose face is already right is finished work.
- **The next build sprint is S69, and it is specified.**
  `docs/hand-off/product-hero-sprint.md` is the brief: section 3 the target
  schema, 4 the file plan, 5 the test-first order, 6 the four image prompts, 7
  the content that must not die with the renderers. Section 7 is the part most
  likely to be done badly - the story beats and the exploded layer labels are
  product writing that exists nowhere else in the repo, so the strings are
  inventoried and guarded by a test written while they are still on disk,
  before any renderer is deleted.
- **Read this before proposing any sprint.** The posting month is **live and
  running**, and the build work is ahead of the posting. `CALENDAR_START` is
  `2026-10-12`, so week one began on Monday 12 October. Two LinkedIn slots have
  already gone by unposted - Tue 13 Oct (the recruiter 4x5 video) and Wed 14 Oct
  (the recruiter carousel). **The default next action is to post, not to
  build.**
- **Where the posting plan lives, with real dates.** `/docs/social-launch-kit`
  (owner access) renders the whole month from
  `features/showcase/lib/domain/posting-schedule.ts`: one row per week, the
  date for each slot, the asset to upload, the channel, and the doc each post
  links to. `/docs/social-launch-pack` carries the ready-to-paste copy for
  recruiters and clients, and `/docs/social-and-recruitment-marketing` the
  playbook behind it. The month is 16 slots, 7 of them LinkedIn. The next three
  LinkedIn slots after this block was written: **Tue 20 Oct** (journey 4x5 ->
  `/docs/system-architecture-overview`), **Wed 21 Oct** (engineer carousel ->
  `/docs/architecture-in-diagrams`), **Fri 30 Oct** (email case-study carousel
  -> `/docs/case-study-email-platform`).
- **One thing to check before pasting a number into a public post.** The live
  figures - test counts, coverage, architecture metrics - render inside gated
  docs. A recruiter following a link from LinkedIn cannot see the page that
  justifies the count, so either name the scope in the post itself or drop the
  number. The profile About does name its scope: the counts sit in the Momo
  Audio paragraph and a guard holds them there, because 2,009 tests is what one
  repo has and not what the owner has written. That is a standing rule, not a
  sprint.
- **Two files are untracked on purpose.** `public/brand/herman.jpg` is the
  owner's headshot, referenced by nothing in the codebase, and committing it
  would publish a personal photo to a public repo.
  `docs/hand-off/banner-images-next-session.md` is a spent prompt whose work is
  done. Leave both alone rather than tidying them in.
- **CI costs two full runs per merge**, because `.github/workflows/ci.yml`
  triggers on `pull_request` *and* on `push: branches: [main]`. Keep a sprint to
  one push. A `paths-ignore` on the push trigger only - never on the PR trigger,
  which can leave a required check pending forever - would halve that for
  docs-only changes; it is offered and not yet taken. `gh pr checks` can report
  a finished job as `pending`; `gh run view <run-id>` is the one that tells the
  truth.
- **Facts.** The merged-PR recount is red by exactly one at the start of every
  sprint. `pnpm facts` clears it. That is the guard working. Run it again after
  the last new source or test file, because `qa/unit/meta` asserts once per file
  and the eight fact-drawing exports go stale the moment a count moves - seven
  of them did this sprint, from seven new unit tests and nothing else.
- **A later contrast candidate** is the amber and emerald literals, and its
  numbers were measured on this tree rather than guessed: `text-amber-500` is
  the low-stock line a buyer reads on a product detail page (`stockTone` in
  `features/products/components/product-purchase.tsx`) and it measures 1.88:1
  on `--muted` and 2.05:1 on the page in light theme, against 9.17-9.79:1 on
  dark; the in-stock dot beside it is `bg-emerald-500` at 2.36:1, under the 3:1
  non-text floor. The low-stock *badge* on the listing is a different surface
  and is already fine at 10.45:1, so that is two sites, not an amber sweep.
  `--warning` already exists; look there before adding a token.
- **How to run a build sprint, if one is called for.**
  `.agents/skills/sprint-workflow/` from step 0. Branch
  `v0/s<next-number>-<short-name>` from a freshly fetched `origin/main` - S68 is
  taken by the profile copy above, so the next is S69 onward.
- **At the end of the sprint,** rewrite this block as part of the closeout. The
  next session's prompt is a file in the repo, not something to ask a finished
  session to compose.

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
| S59    | #212     | `29832c9`            | The showroom answers the engine room: the objections a buyer actually asks are parsed out of the three owner-gated docs that carry an objection-handling section - the pitch itself, not a list typed alongside it - and each one must name the public CTO doc that answers it plus the words that prove the answer is still there, so the guard fails on a new objection with no public home, on an entry whose objection the pitch has dropped, and on a public page edited until its anchors are gone. Three of the fifteen had no public answer anywhere: `deliverability`, `rented`, `per-contact` and `another developer` appeared in no public doc, while the gated demo script sent a buyer to an owner-gated page for "the real cost saving". The showroom now answers all three, and anchors match on word boundaries because a substring search finds `ESP` inside "responses". Retro: two anchors were wrong rather than the copy being missing, so the rule is that a phrase a guard demands is lifted from the repo or written in the same change |
| S60    | #214     | `0cff1cd`            | The About timeline's teal progress line survives being painted: it was authored as a 1 CSS pixel column, and a browser cannot paint less than one device pixel, so below retina density it blended with the page at partial alpha - 3.36:1 against the background at 100% zoom on a DPR-1 display and 1.67:1 zoomed out to 50%, with the grey static track in the same column underneath, so what survived read as "the track is there, the teal is gone". Nothing had regressed: the component is unchanged since #114 and `scaleY` sweeps 0 to 1 across the scroll range exactly as written. It was authored and reviewed on a retina display, which is the only reason it shipped. At 2px the line reaches rgb(99,188,188) / 9.30:1 at DPR 1, pixel-identical to how retina renders it, and the 1px track is left alone so the hairline look is unchanged. A smoke test screenshots the line and reads the pixels back through a canvas, because asserting the width class would pin the fix rather than the defect and computed style reports the colour at full strength however faintly it is really drawn. Retro: the guard's first draft passed against the unfixed component, because the icon nodes are teal circles centred on the same column and the sampled band had landed on one - so a measuring guard now has to be shown sampling the right thing, not merely failing |
| S61    | #216     | `46746bd`            | What a client receives at Launch, Growth and Scale, and the delivery model that decides every row: built-and-run, so the client owns their domain, Stripe, Resend, database account and data while the platform runs on managed infrastructure, and the exit is data export plus source escrow rather than the repository on day one. The ladder is typed data the gated doc renders, so the table a buyer is quoted from and the data the guard checks are one object. Also ADR-012 (one isolated deployment per client, not multi-tenancy), the `infographic-offer` column that had been selling clients a local runbook and green CI, `GLOSSARY.md`, and three guards shown red first - unique `order` per category (which found seven live collisions), every deliverable valued at every tier, and an ADR index that lists every record (which found ADR-011 never indexed). |
| S62    | #218     | `c9df992`            | The public half of the tier promise: `/docs/what-you-receive` renders the same typed ladder as the gated master - the ten rows per tier, the Setup checklist derived from the gated Setup sentence, the pricing shape with no numbers, the data-export promise and the escrow terms - and names the Setup dependency the owner does not control, so a buyer reading alone gets the answer a buyer on a call gets. Wired into the S59 drift guard as its fourth source: four objections parsed out of the gated doc, one `PUBLIC_ANSWERS` entry each, `OBJECTION_FLOOR` 15 to 19, every anchor lifted from the page as written and shown red on the real files. Adding the first doc route to the axe scan found a real pre-existing AA failure in shared chrome - the 10px labels at `text-foreground/40`, 3.30:1 on dark and 2.68:1 on light - raised to `/60` across the docs surface, so all 57 doc pages pass rather than the one that is scanned. |
| S63    | #220     | `01d8ac8`            | The launch pack's links resolve instead of being placeholders: twenty `[live URL]` tokens across the three `social-launch-pack*.ts` files are now `${LIVE}` from `absoluteUrl("")`, as the launch kit has done since S46, so paste-ready copy carries the real host and a fork gets its own. The guard that allowed it is tightened - `[live URL]` is off the placeholder allow-list and the sweep covers the whole doc, not only the code blocks, which is where the twentieth sat: a callout telling the reader to replace the other nineteen. Two new guards: every link is on this site's own origin (a `*.vercel.app` host fails sign-in and loses the session after checkout) and every path resolves to a doc, a route or a file in `public/`. `internalDocLinks` had to be fixed first or the substitution would have been a silent regression: a host ends in a word character, so `...co.uk/docs/x` was skipped by the same lookbehind that skips `features/docs/api`, and the only guard checking those links exist would have gone quiet on all twenty at the moment they went live |
| S64    | #222     | `72deeb6`            | The slides stopped contradicting the posts they are attached to. S63 made the post text read the live facts; the images beside it still carried the numbers frozen at their last export - `recruiter/proof.png` printed "Automated tests 1,617" under a column headed TODAY, beneath "Measured on every run, not claimed". Measured rather than assumed: 8 of 73 exports drew a drifted fact, 64 drew none, and `shared/before-after.png` draws four facts and was already current (arch has read 0/0/0/32 since S43). The fix is the missing half of the facts guard rather than a re-export: `public/showcase/export-manifest.json` records, per published file, the value of every fact drawn on it at render time, and `qa/smoke/export-freshness.spec.ts` compares that to the facts now and names any file whose numbers moved - per file and per fact, not per snapshot. Only a render may write a record; there is deliberately no helper that rebuilds the manifest from today's facts, because such a helper would turn every drift into a green test. `factRefsIn` reads the facts off a slide by shape, mirroring `findHardCodedNumbers`. Shown red on the real tree naming all 8, then green. All 73 re-exported. 32 unit tests. Retro: three rules, all from the gate - a guard lives where it cannot deadlock the command that repairs it, only a number that is a deterministic function of the repo may gate a committed artefact (CI's Node 24 read coverage 41.91/31.69 from the tree this machine read 41.88/31.62 from, so coverage is recorded but never compared), and "the export is byte-identical" was folklore and is false: 57 of 64 PNGs matched across S48's export and S64's, but all 9 PDFs change every run and the two mermaid slides re-lay out |
| S65    | #225     | `2c7cb67`            | The guard that would have named `shared/offer.png` the day it went wrong. S64's manifest compares the facts a published file drew, and 64 of the 73 draw none - so for those it was silent by construction, and `offer.png` proved it: S61 (#216) rewrote its third column from "Handover / Written handover guide" to "Yours to run / Source escrow if I stop trading", that sprint's whole point being that "handover" was the wrong promise, and nothing re-exported it, so the PNG and the two documents that page it showed the retired wording for three sprints. The same record now holds `sourceHash`: `contentHash` of the slides the renderer read, compared the same way - a second field and a second comparison, not a new mechanism. The definition is hashed, never the published bytes, because only a deterministic function of the repo may gate a committed artefact. Page numbers are in the hash because the shell prints them, which made `exportRenderSlides` the single resolution of what an export renders - the render route now reads it too, so lengthening the email case-study carousel dates its eight standalone PNGs rather than only the PDF. FNV-1a rather than `node:crypto`, because `export-manifest` is reachable from the slice's client-safe `index.ts`, and the hash is pinned by a unit test since every hash in the manifest came out of that one function. Shown red twice for two different reasons: with the field missing it named all 73, which proves only that the field is required, and then - after the re-export recorded the hashes - reverting the offer column to the exact pre-S61 wording from `46746bd^` named `shared/offer.png`, `buyer/carousel.pdf` and `business-case/brief.pdf` with both hashes each. Nothing was already drifted, and that was measured before anything was re-exported: one `renderedFrom` across all 73 records, no slide definition touched by S64, and nothing a definition reads changed between `72deeb6` and `322108f`. The re-export confirmed it independently - of 64 PNGs exactly 6 changed, the two mermaid slides and the four whose facts had moved, and the other 58 were byte-identical, which also proved the route refactor shifted no layout. 1,752 unit (+26). Retro: four rules - a new field in a committed record goes red everywhere at once and that red is not the proof; hash what the renderer reads, not the data at hand; a `node:` import in `domain/` reaches a browser bundle through the slice barrel; and BigInt literals need a target this repo does not compile to. |
| S65a   | #224     | `7452797`            | Posting copy a buyer or recruiter reads today, corrected on two counts. Eight `[your-url-here]` placeholders across two docs - six in `social-and-recruitment-marketing.ts`, including the LinkedIn recruiter post, the X thread's closing line and the CV / resume project line, and two in `showcase-and-portfolio.ts`. S63 fixed the twenty in the launch pack but was scoped to those three files, so these were never seen; all eight now read `${LIVE}` from `absoluteUrl("")`, and the two sentences telling the reader to hand-edit the bracket went with them, because the placeholder and the instruction to replace it are one defect. Second, the recruiter pack credited a platform that was built here: it opened "I took a Next.js 16 commerce platform (Prisma on Neon, Better Auth, Stripe, Resend) and ran it like a team codebase" when all four were added in this repo and the starting point was a v0 template that was a single marketing page - a 192-frame canvas scroll animation, a glassmorphism nav and a features grid, with no cart, checkout, admin, database, auth, email or docs. A recruiter reading that sentence prices the work as maintenance. Both recruiter posts now say what was inherited and what was built. Content only on purpose: a guard over both defects, and the provenance as typed data, were written and shown red, then held back because each new file moves the unit count, invalidates the eight fact-drawing slides and forces a 73-asset re-export that failed twice under memory contention - not worth blocking paste-ready copy on. Unit count unchanged at 1752, which is the proof no export was owed. Retro: an audit of posting copy must sweep every doc, because a guard scoped to one file reports nothing about the others; and parallel sprints on this repo collide on the two global artefacts (the fact snapshot and the 73 exports) even when their source files never touch - run one at a time |
| S66    | #227     | `1403afb`            | The light theme, scanned for the first time, and the reason its fix was invisible. The muted-label ramp went first: 209 occurrences migrated - 196 of the sub-AA `text-foreground/15..55` ramp and 6 alpha'd muted labels onto the existing `--muted-foreground`, 4 onto a new `--muted-glyph` at the 3:1 non-text floor (unfilled stars, the timeline watermark year), 3 coloured sites de-alpha'd - behind `qa/config/contrast.ts`, an oklch -> sRGB -> WCAG model pinned against WebAIM boundary greys that reproduces the two ratios axe measured in a browser in S62 (3.30:1 dark, 2.68:1 light), plus a sweep that measures every `text-<token>/<alpha>` in the source and refuses a token it has not been taught to place. `qa/axe` was rewritten to scan both themes - light was never scanned and is the worse one - and to open the cart drawer and the mobile nav, which between them held 19 of the 209 labels and had never been rendered by any scan. Then the light accent: `--accent-teal` 0.58 -> 0.51, because at 0.58 it read 3.93:1 as text on the page, and five routes failed axe on it. **And that fix did not reach a single visitor, which is the sprint's real finding.** `buildThemeCss` emits the active template's tokens as a `:root` block in an inline `<style>` after globals.css, and `StoreSettings.theme` holds a full copy of every installed template - so the database, not the stylesheet, is what the browser paints. The served page still carried 0.58 while the stylesheet, the preset constant and every static guard said 0.51. A guard that reads `app/globals.css` alone measures a palette nobody sees. `normalizeThemeState` now refreshes a built-in preset whose persisted colours still match a set it used to ship with, and leaves anything one channel different alone, because `brand-colors-form` writes a client's edit back under the same id and reverting that would be the worse bug. `theme-preset-contrast.test.ts` compares the preset to the stylesheet token for token and holds every preset to AA - which caught `solar-amber` shipping a light accent at 3.11:1, a preset a client can activate from the admin with no code change. Three further surfaces only the browser could show. Accent text on a tint mixed from the same token: darkening `--accent-teal` darkens `bg-accent-teal/10|12|15` with it, so the accent keeps only part of its gain and still reads 4.43-4.45:1 - five sites moved to `--accent-teal-muted`, which unlike a literal still follows a client's palette. The `Today` pill on `/contact` stacks its own tint on an already tinted row, where no single tone works because the tint darkens the surface on light and lightens it on dark, so it is a solid accent fill at 5.24:1 / 9.44:1. And the nav pill renders over the dark hero as well as the page, where in light theme the same tint composites to near-black and the deeper tone reads 2.74:1 - `onDark` already chose the inactive colour and now chooses the active one. The `Open now` badge was raw `emerald-400/15` + `emerald-300`, a dark-tuned palette literal no token guard could see, at 1.25:1 on light; it reads `--success`, whose light value moves 0.6 -> 0.46 while dark stays put so the slide renders that read it are unchanged. `theme.ts` crossed the 300-line audit threshold and split along a real seam: `theme-presets.ts` (shipped palettes), `theme-snapshots.ts` (what they used to be). Unit 1752 -> 1826, axe 11 -> 32; the eight fact-drawing exports were re-rendered, because the handoff said none was owed on the grounds no showcase file changed - true, and beside the point: the slides draw the test counts this sprint moved. Retro: a guard is only as true as the layer it reads, and this repo paints from the database; the cart-drawer scan sat 30s behind its own dialog and reported nothing until the click was made conditional; and a tint mixed from a token is not a surface a static sweep can model - it moves with the token, in opposite directions per theme |
| S67    | #228     | `9c0dc27`            | `--destructive` was the last colour in the palette written as one value for both themes, and the handoff said to split it per theme "the way every other colour here already is". Measured first, with the repo's own model rather than the plan's numbers, and that could not work: the token does two opposed jobs - the red fill under a white label (the "Sold out" tag, the destructive button and badge, the status dot) and red words on the page (a form error, the out-of-stock line, an admin delete icon on hover) - and on dark the text role needs `L >= 0.62` to clear AA on every surface while the white label on the fill needs `L <= 0.58`. No value sits in both ranges, in either theme, so the split is by role as well: `--destructive` keeps the fill, and a new `--destructive-strong` carries text, the way `--accent-teal-muted` carries accent text needing more contrast than the accent has. Light 0.52 / 0.46, dark 0.577 (unchanged) / 0.64; 38 `text-destructive` occurrences across 24 files migrated, and a source sweep now refuses the fill colour as a text colour so the roles cannot drift back together. Two of the handoff's three numbers were claims and are corrected: dark's worst surface is `--muted` at 4.13:1, not `--background` at 4.41:1, and **the tag was already below AA on light** - it renders `bg-destructive/90`, which composites to 4.32:1 under its own white label, while the old guard measured the solid colour at 4.56:1 and passed. That is S66's lesson one layer down: measure the alpha the markup asks for, not the token it names. The tint alphas are read off the markup too - `/[0.06]`, `/10`, `/12`, and a `/20` that is `dark:`-prefixed in all three shadcn menus, so light is not held to a tint it never paints, and would measure 4.09:1 if a prefix were dropped. Two browser claims the model cannot make, both shown red on the real files. Deleting `--color-destructive-strong` from `@theme inline` leaves the utility matching nothing and the text inheriting `--foreground`: the probe read `rgb(11,11,11)` while the token still resolved `rgb(188,0,0)`, and every static guard stayed green because the stylesheet was right. And reverting light `--destructive` to 0.577 put the painted fill at `rgb(233,25,35)` with its label at 4.35:1 - the same number the unit model predicts for `/90` over `--background`, one instrument sampling pixels and the other doing arithmetic. **The finding that changed the sprint's browser layer**: neither role renders anywhere the gate looks. The first spec draft waited on `/products` for a "Sold out" tag that is not there - the fixture has `momo-air` at `stock: 0`, but the served catalog comes from the database, where nothing is sold out, and the text role needs a validation failure no public route reaches at rest. axe has scanned `/products` in both themes since S66 and was always going to report nothing, whatever the colour was. A route list is a claim about coverage; the data behind a scanned route is a second claim nobody had made. So the measurement is a probe carrying the tag's own utilities - a question put to the served stylesheet, not a stand-in for its markup - with the real tag measured as well whenever the catalog has one. Unlike the accent, this token is not painted from the database: `buildThemeCss` emits four variables and no destructive one, which is asserted rather than assumed (shown red by adding one; it named `titanium-teal`). Unit 1826 -> 1835, axe 32 -> 36; 73 re-exported, 16 files changed. Retro: three rules - a handoff's proposed *fix* is a claim, not only its numbers; a guard over tokens cannot see whether the utility exists; and a scanned route only speaks for the states its data puts on screen |
| S68    | #232     | `b5dae18`            | The agreed profile copy for three channels, and the field limit that proved the handoff's About could not be pasted. `docs/hand-off/profile-copy-s68.md` was agreed in full and marked not-a-draft, so it was measured rather than adopted: the About ran to **4,050 characters against LinkedIn's 2,600**, and LinkedIn truncates the overflow mid-sentence rather than refusing it. Nothing else in the handoff was over - headline 183/220, Adu Dev tagline 96/120, overview 1,460/2,000, Facebook short 201/255 - so the About was the only blocker, and the resolution came from the owner rather than from a rewrite: pull the Nexgen paragraph, which already has its own Experience entry with its own 2,000-character field, and the remaining seven paragraphs total 2,541 with nothing reworded. Two plain-text corrections the handoff could not have seen: LinkedIn renders no markdown, so the `**bold**` markers and the backticks around `any` and `useEffect` would have pasted as themselves, and the existing pack About already writes those words bare. Five fields now live in the two audience files per the handoff's file plan - `socialLaunchPackRecruiterProfileBlocks` (personal headline, About) and `socialLaunchPackClientProfileBlocks` (tagline, overview, Facebook description) - spliced into the parent's `Profile and discoverability` section so the fields a reader fills in one sitting stay contiguous and the section's own guards can still see them. **The length guard measures the paste, not the render.** `absoluteUrl("")` is `http://localhost:3000` under CI's env and 10 characters longer on the deployed host, so every link in the copy is grown by the difference before measuring; shown red at 2,602 on a 60-character pad that the naive `code.length` read as 2,592 and would have passed, which is the exact band the helper exists for. The channel split retires the personal profile's client-angle headline - LinkedIn allows one personal profile, so it is recruiter-first with a single closing line naming Adu Dev, and the client offer is the company page's tagline - and every headline block is now required to name its channel, because an unlabelled one is the old shape returning. The skills list is reordered as a consequence rather than a preference: the guard holds the pinned first three to terms the headline leads with, and the agreed headline names Prisma where the old one named PostgreSQL, so `Next.js / React / TypeScript` lead, Prisma moves to fourth and PostgreSQL to fifth. Two existing guards were corrected rather than satisfied. The Open to Work guard demanded the word `handover`, which was never in its own callout: it was passing on `handover-ready commerce builds` in the retired headline three blocks away, and that word is the promise S61 deliberately replaced with built-and-run, so it is re-anchored on `client work` and `run it without you`, both lifted from the callout itself. And the `Keep claims accurate` callout told the reader to quote no client results, which the new Adu Dev overview does by naming Nexgen - a real delivered platform, unlike the Momo Audio template the callout was written about - so it now scopes the prohibition to Momo Audio and permits Nexgen by name. The numbers rule is a guard, not a convention: the two source files must not contain the rendered counts as literals while the About must render both, shown red naming `social-launch-pack-recruiter.ts` and `219`; the paragraph carrying them must also name Momo Audio, because a recruiter reading 2,002 as career-wide is a claim the owner cannot back up; and the client page is swept for both counts and for any hiring signal, since an agency page that reads as one person looking for a job sells against itself. Unit 1835 -> 1842. Retro: a field limit belongs to the box rather than to the copy, so five fields with four ceilings cannot share one guard however alike their titles look; agreed copy can still be unpasteable, because length is a claim a handoff rarely checks; measure copy as it will be pasted, not as the test environment renders it; and a guard can be green on a phrase three blocks from the thing it claims to be checking. |
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

## Next sprints (added after S58, updated after S59) - candidates

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

**Shipped as S60 (#214): the About timeline's progress line.** Not from this
list - the owner reported it from the live site, correctly guessing it "might be
there just very hard to see". It was: a 1 CSS pixel line cannot be painted below
one device pixel, so it blended away to 3.36:1 on a DPR-1 display. The three
candidates below are untouched by it.

**Shipped as S59 (#212): the gated-to-public drift guard.** It found three
objections the gated pitch commits to answering that had no public answer at
all, and filled them. It narrowed the other three candidates by nothing - they
stand exactly as written here.

**Shipped as S61 (#216): the tier deliverables and the delivery model.** The
candidate asked what a client receives at each tier. Answering it moved the
question one level down: the delivery model itself was unrecorded, and the repo
pointed both ways - the gated pitch selling "one deploy can run several brands
or clients", a posted client infographic promising a local runbook and green CI,
and no statement of who owns what. Settled in a four-round `grill-with-docs`
session: **built-and-run**, escrow and export as the exit, a code buy-out priced
at Scale only, client-owned vendor accounts at every tier, and a monthly rather
than an optional care plan. The three meanings of "handover" now have separate
names in `GLOSSARY.md`.

**Shipped as S62 (#218): the public half, wired to the drift guard.** The gated
tier promise now has a public counterpart in `Business Case` -
`/docs/what-you-receive` - rendering the same typed ladder rather than a retyped
copy of it, and the four objections the ladder provokes are parsed out of the
gated doc with a `PUBLIC_ANSWERS` entry each. `OBJECTION_FLOOR` 15 to 19. Every
anchor is a phrase lifted from the public doc as written, and each was shown red
on the real files first - which taught that an anchor on a doc rendering typed
data matches in both the table and the prose, so a one-sided edit leaves the
guard green, correctly, because the answer is still on the page.

Adding `/docs/what-you-receive` to `qa/axe` put a doc route in that scan for the
first time and found a real pre-existing failure: the 10px mono labels on every
doc page were `text-foreground/40`, 3.30:1 against the dark background and
2.68:1 against the light one, both under AA for normal text. Raised to `/60`
across the doc reading chrome, the hub cards and the shared on-this-page rail.
The wider pattern is untouched: `text-foreground/40` appears 85 more times in 31
files outside the docs surface, which is the candidate below.

**Shipped as S63 (#220): the launch pack's links.** Not from this list - the
owner called it once the domain was current and being linked from real posts.
Twenty `[live URL]` placeholders in paste-ready copy, and the guard over that
copy had an allow-list with `[live URL]` on it, so it had been green through
every one of them. It also found that substituting would have blinded the only
guard that checks those links exist, because a host ends in a word character and
`internalDocLinks` reads that as a source path. The three candidates below are
untouched by it; it added the fourth.

**Shipped as S64 (#222): the full showcase re-export, and the guard that makes
it the last one needed by hand.** The candidate asked for a re-export. Doing it
first required knowing what was actually stale, and the answer was smaller and
more precise than "all of them": 8 of 73 exports drew a fact that had moved, 64
drew none, and one that draws four facts was already current. A re-export alone
would have fixed those 8 and left the next drift just as invisible, so the
sprint shipped the missing half of the facts guard instead - a manifest of what
each published file drew at render time, and a smoke test that compares it to
the facts now - and then re-exported all 73 behind it. That closes this
candidate and opens the one below it: the manifest proves a file's *numbers*
are current, and says nothing about its *words*.

**Shipped as S65 (#225): the guard over slide-source drift.** The candidate
asked for a second field and a second comparison in S64's manifest, and that is
what it is: `sourceHash`, a `contentHash` of the slides the renderer read,
compared the way a fact is compared. Two things it taught that the candidate did
not anticipate. The page number is part of what a file shows, so the hash had to
cover each page's position, which made `exportRenderSlides` the single
resolution of what an export renders and put the render route on it - without
that, lengthening the email case-study carousel would have dated eight standalone
PNGs invisibly. And the first red, with the field missing from all 73 records,
proves only that the field is required; the proof that drift is detected is the
second red, naming one file, after a re-export has recorded the hashes.

Nothing currently published was drifted, measured before anything was
re-exported: one `renderedFrom` across all 73 records, no slide definition
touched by S64, nothing a definition reads changed since. The re-export then
confirmed it - 6 of 64 PNGs changed, being the two mermaid slides and the four
whose facts had moved.

**Shipped as S67 (#228): the destructive split, and the state no scan reaches.**
The first candidate below is done, though not as it was written - splitting
`--destructive` per theme could not meet AA, because the token does two
opposed jobs and on dark their ranges do not overlap, so it became two tokens
with per-theme values. It also found the `Sold out` tag already below AA on
light, at 4.32:1, because it renders `bg-destructive/90` and the guard measured
the solid colour. The lasting lesson is about the gate rather than the colour:
neither destructive role renders anywhere `qa/axe` looks - the tag needs a
sold-out product and the database has none - so a scanned route only speaks for
the states its data puts on screen.

**Shipped as S66 (#227): the muted-label pass, and the layer no guard was
reading.** The first candidate below is done - 209 occurrences onto
`--muted-foreground` and a new `--muted-glyph`, a contrast model the unit suite
can measure with, and a `qa/axe` that scans both themes plus the cart drawer and
mobile nav. The light accent moved with it. The sprint's lasting lesson is not in
that list: the fix was correct in `app/globals.css` and still invisible, because
`buildThemeCss` paints the active template from `StoreSettings.theme` as a
`:root` block after the stylesheet. Read the served page, not the source, before
believing a colour guard.

**Shipped as S65a (#224): the older showcase placeholder.** The third candidate
below was struck, not deferred - S65a resolved all eight `[your-url-here]`
tokens in `showcase-and-portfolio.ts` and `social-and-recruitment-marketing.ts`
from `absoluteUrl("")` and deleted the two sentences telling the reader to
hand-edit the bracket.

Still candidates, in the order they were judged most useful, none started:

- **The amber and emerald literals, measured on this tree.** `text-amber-500` is the low-stock line on a product detail page (`stockTone` in `features/products/components/product-purchase.tsx`) and reads 1.88:1 on `--muted` and 2.05:1 on the page in light theme, against 9.17-9.79:1 on dark; the in-stock dot beside it is `bg-emerald-500` at 2.36:1 on light, under the 3:1 non-text floor. Both are dark-tuned Tailwind defaults, the same shape as the `emerald-300` badge S66 found at 1.25:1, and no token guard can see them because they name no token. The low-stock *badge* on the listing is a different surface and is fine at 10.45:1 (`bg-amber-500/90 text-black`), so this is two sites, not an "amber" sweep. `--warning` already exists; look there before adding a token. Gate: none. Data impact: none.
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
