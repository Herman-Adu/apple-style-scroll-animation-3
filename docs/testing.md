# Testing

The QA suite lives in `qa/` and is split by test type. Configs live in `qa/config/`.

```
qa/
  config/         vitest.config.mts, playwright.config.mts
  unit/           Pure logic — fast, no network, no browser
    mappers/      Strapi raw shape -> domain shape (contract tests)
    seo/          site-url resolution, structured data
    strapi-client/ fetchStrapi transport (timeout, retry, unwrap, errors)
    email/        render, placeholders, copy-quality, versions, sections, starters, locks
  integration/    Modules wired together with fetch mocked
    features/     product api seam (local vs Strapi branch)
    revalidate-route/ webhook -> tag invalidation
    checkout-finalize/ checkout finalisation (order + emails)
    email/        reset-template against the version history
  smoke/          Playwright: every route renders (200 + key content)
  seo/            Playwright: metadata, OG, sitemap, robots, RSS surfaces
  axe/            Playwright + axe-core: accessibility
```

## Running

```bash
pnpm test              # all unit + integration (Vitest)
pnpm test:unit         # unit only
pnpm test:integration  # integration only
pnpm test:coverage     # with coverage
pnpm test:e2e          # all Playwright suites
pnpm test:smoke        # routes render
pnpm test:seo          # SEO surfaces
pnpm test:axe          # accessibility
pnpm test:all          # unit/integration + e2e
```

## Which app the browser suites talk to

The Playwright gates reuse a dev server already listening on `PORT` (3000 by
default) and boot one only if nothing answers. That is a shortcut with a sharp
edge: another project's dev server on the same port gets reused just as happily.
The `app-identity` project in `qa/config/playwright.config.mts` runs first and
every other project depends on it, so the run stops with the name of whatever
answered instead of reporting a stranger's pages as broken.

To run the gates on another port, move the canonical origin with it -
`PORT=3100 NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm test:seo` - because
the SEO suite checks that each page's canonical points at where it is served.

## How the layers map to the architecture

- **Unit / mappers** are the highest-value tests for the CMS migration. They pin the contract between Strapi's field shapes and the domain schemas. If a content-type drifts, these fail before anything ships. Keep them current as content-types evolve.
- **Unit / strapi-client** covers the hardened transport: timeouts, retry/backoff on 5xx and network errors, fail-fast on 4xx, and `{ data }` unwrapping.
- **Integration / features** exercises the seam itself — that the local branch and the Strapi branch (with `fetch` mocked) both return identical validated types.
- **Integration / revalidate-route** verifies the webhook maps models to the right cache tags and rejects bad/missing secrets.
- **Unit / email** pins every pure editor rule in `features/email/*` — version pruning, saved-section picking and validation, starter shape (unique ids, valid groups, hero images exist), and locked-block behaviour (no edits/moves/deletes, insertion above trailing locks). Write these first when adding an editor feature; the UI only calls these functions.
- **Integration / email** and **integration / checkout-finalize** run against the database and verify reset-to-original and the post-checkout email/order flow.
- **Smoke / SEO / axe** are Playwright suites that run against the dev server for real-browser guarantees.

## Facts and the coverage ratchet

`pnpm facts` runs unit + integration with coverage, lists the Playwright tests, measures the architecture and counts the merged pull requests. It writes the result twice:

- `.generated/facts.json` (git-ignored) — read by the showcase render. Every number on a slide comes from it, and a unit test fails if a slide types a number in instead of using `{ fact: "..." }`.
- `lib/facts/snapshot.json` (committed) — imported as `@/lib/facts` by anything that renders live. A docs page resolves its numbers when it renders, not when an image is exported, so it still needs them after a deploy, where `.generated/` does not exist.

Both come from the same run, so they cannot disagree. The owner's paste-ready posts quote `facts.tests.total` and `facts.repo.mergedPrs` rather than typed-in figures.

### Keeping the snapshot honest

A committed snapshot can still go stale, and has three times - S44, S48 and S54. `qa/unit/docs/doc-facts.test.ts` checks the snapshot against itself (`unit + integration + smoke + axe + seo === total`), which a wrong snapshot also satisfies, plus a hand-written list of counts that were wrong before - a list that can only ever check the past.

The recount is `qa/smoke/facts-freshness.spec.ts`. It re-derives the browser layers from a Playwright `--list`, `repo.mergedPrs` and `repo.latestPr` from `git log`, and `tests.unit` from a real run of `qa/unit`, and compares each against the committed snapshot. Every recount calls the same function in `scripts/lib/facts.mjs` that `pnpm facts` uses, so the guard and the generator cannot drift into two definitions of one number. Run the browser gate before a merge and a stale snapshot fails there, naming the field and telling you to rerun `pnpm facts`.

Two things about where it lives:

- **It is in the browser gate on purpose.** `scripts/facts.mjs` abandons the run when Vitest fails, so a unit-level freshness guard would deadlock: the stale snapshot would block the one command that repairs it. `pnpm facts` only *lists* Playwright tests, so a failure here never does.
- **It cannot fail in CI.** The `app` job runs `pnpm facts` before the browser suites, so the snapshot on disk has just been regenerated by the time the recount reads it. This is a local pre-merge gate.
- **It is red by exactly one immediately after a merge.** The snapshot committed in a pull request cannot record that pull request's own squash commit, so `main` at rest is always one merged PR ahead of the number it carries. The fix is the next sprint's first `pnpm facts`, not a looser guard: every sprint regenerates and commits the snapshot, which is the behaviour this guard exists to force.
- **The merged-PR recount skips itself on a shallow clone**, where there is no history to count and it would otherwise agree with any snapshot at all. That is why the `app` job checks out with `fetch-depth: 0`: `actions/checkout` fetches a single commit by default, and until S54 every CI run therefore published a facts artifact claiming **0** merged pull requests and overwrote the snapshot it then built and smoke-tested with it. Nothing read the field afterwards, so nothing failed - the recount is what found it.

### Keeping the exported images honest

The recount above protects everything that resolves its numbers when it renders. It cannot see a PNG. A slide bakes its figures in on the day it is exported, and the launch pack tells the owner to attach those images to the post whose text reads the facts live — so S63 made the words current and left the picture beside them quoting the Oct 9 snapshot. That is why S48 shipped five PDFs with the wrong number drawn on them, and why it happened twice.

`public/showcase/export-manifest.json` records, per published file, the value of every fact drawn on it at the moment it was rendered. `qa/smoke/export-freshness.spec.ts` compares that to the facts now and names any file whose numbers have moved. Three decisions carry it:

- **Per file and per fact, not per snapshot.** 65 of the 73 published exports draw no fact at all, and `shared/before-after.png` draws four that have read 0/0/0/32 since S43 — it is current, and a snapshot-level comparison would call it stale. Guards that cry wolf get allow-lists, and an allow-list is the guard agreeing with the bug.
- **Only a render may write a record.** There is deliberately no helper that rebuilds the manifest from today's facts, because it would turn the guard green without re-rendering a file. The export harness records a file after it has written it; `mergeExportManifest` keeps the records of files the run did not touch, so a partial export cannot claim them.
- **It is a browser test for the same reason the recount is.** `pnpm showcase:assets` is `pnpm facts && playwright test`, and `scripts/facts.mjs` abandons the run when Vitest fails — so a unit guard over the real files would block the command that repairs it. The pure rules are unit-tested in `qa/unit/showcase/export-manifest.test.ts`, which never reads the real manifest and so cannot deadlock.

It was red on the real files before it was green, naming all eight: `recruiter/proof.png` and its carousel, `engineer/tests.png`, `engineer/coverage.png` and their carousel, `how-it-was-built/carousel.pdf`, `shared/bar-chart.png` and `business-case/brief.pdf`. The guard prints every comparison it made, pass or fail, because "73 files checked" is not evidence when only eight carry a number that can go stale.

**What it detects, and what it does not.** It detects a number drawn on a committed file that has since moved, a file with no record of a render at all, and a slide whose set of facts changed after its file was rendered. It does not detect an edit that changes a slide's words, colours or layout without touching a fact — that file is just as stale and this guard will call it fresh.

The re-export proved that gap on the spot. `shared/offer.png` draws no fact and was never flagged, but S61 (#216) had rewritten its third column from "Handover / Written handover guide" to "Yours to run / Source escrow if I stop trading" — the whole point of that sprint being that "handover" was the wrong promise. The slide was never re-exported, so the committed image, and the buyer carousel and business-case brief that embed it, had been showing the retired wording for three sprints. A stale number is embarrassing; a slide contradicting a settled positioning decision is worse, and only the full re-export caught it. `pnpm showcase:assets` after a slide edit is still a habit rather than a gate.

### Prose counts are pinned to the thing they count

A number written into a sentence goes stale silently: re-export a carousel one slide shorter and the paragraph describing it simply becomes false. `qa/unit/showcase/stated-counts.test.ts` pins each one to its artefact - every stated slide count against the page count inside the committed PDF, and the docs library's audience count against the distinct `audience` values the docs actually carry. It also sweeps `features/docs/content/` for a count phrase no assertion covers, so a new claim cannot arrive unpinned.

Page counts are read from the PDF bytes, two ways - the page-tree `/Count` and the `/Type /Page` objects - and compared, because a parse that found nothing would agree with any claim. There is deliberately no PDF dependency: a new one would pull `pnpm build` into the gate for a page count. The sweep carries two allow cases lifted from the files themselves ("Step 3 of 5 slide" in alt text, "the whole system on one page"), because an invented allow case cannot catch a guard that is too greedy.

### A public count is measured or it is dated history

Until S57 every number a reader could check sat behind the owner gate. The posts quote the whole platform - merged pull requests and the full suite - and linked to `/docs/engineering-quality`, whose only counts were the email builder's delivery log, scoped to PRs #63-#84. Both were true. Side by side they read as an inflated claim, because nothing public stated the current scale at all.

So that page opens with a "Where the platform is today" section rendered from the committed snapshot, and the delivery log below it is untouched - S56's lesson is that a true sentence gets pinned, not rewritten. `qa/unit/docs/doc-facts.test.ts` holds both halves: the section must carry the snapshot's own pull-request, test and coverage figures, and the historical log must still be there, because a current-state section above it is what makes the smaller figures legible as a subset.

The same file sweeps every **public** doc for a count phrase and fails any figure that is neither a value in the snapshot nor an allow-listed line of recorded history - the four allow cases are lifted from the files with their reasons, since an invented one cannot catch a guard that is too greedy. The section's assertions read the section's own blocks rather than the whole page, because `docText` includes the summary: asserting against that would let the numbers be moved into the summary and the section deleted, which is exactly how S51's changelog guard passed with its entry removed.

### The showroom answers the engine room

The nine owner-gated `Positioning` docs are the engine room: what the owner charges and how they answer a buyer in the room. The eight public CTO docs are the showroom, read by that buyer with nobody beside them. Nothing failed when the pitch committed to an answer and the public layer did not carry it - the drift that let What's New fall eleven sprints behind before S50.

`qa/unit/docs/showroom-coverage.test.ts` parses the objections out of the three gated docs that carry an objection-handling section, rather than listing them by hand, because a hand-written list can only check the past. Each one is keyed past its quotes and apostrophes and must appear in the manifest in `features/docs/lib/domain/showroom.ts`, which names the public doc that answers it and the words that prove the answer is still there. The guard fails three ways: a new objection with no public home, a manifest entry whose objection the pitch has dropped, and a public page edited until its anchors are gone or moved behind the gate.

Anchors match on word boundaries with the hyphen counted as part of a word, so `ESP` is not found inside "responses" and `page` is not found inside "per-page tax" - a substring search would report a deliverability answer on a page about edge caching (S52: judge the span that holds the mention). Both halves are table-driven with every line lifted from the corpus, since an invented allow case cannot catch a guard that is too greedy. `OBJECTION_SOURCES` and `OBJECTION_FLOOR` are asserted against what the parser actually finds, because a parser that returned nothing would satisfy the coverage check.

It was red on the real files before it was green: three objections had no public answer anywhere - the words `deliverability`, `rented`, `per-contact` and `another developer` appeared in no public CTO doc, while the gated demo script told the seller to send a buyer to an owner-gated doc for "the real cost saving".

Coverage only goes up: the run fails if lines or branches drop below `qa/baselines/coverage.json`. After raising coverage, run `pnpm facts --update-baseline` and commit the new baseline. CI runs `pnpm facts` and uploads the file as an artifact; `pnpm showcase:assets` runs it before rendering.

## Notes

- The unit/integration tests mock `fetch` inline. A future improvement is an MSW-based mock Strapi so the whole app can run in the browser against a simulated CMS before the real instance exists.
- The `axe` suite requires system browser libraries; it may not run in restricted sandboxes. Run it in CI or locally.
- When you change a mapper or schema, run `pnpm test:unit` — it is the fastest signal that a content contract broke.
