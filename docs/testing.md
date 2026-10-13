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

### Prose counts are pinned to the thing they count

A number written into a sentence goes stale silently: re-export a carousel one slide shorter and the paragraph describing it simply becomes false. `qa/unit/showcase/stated-counts.test.ts` pins each one to its artefact - every stated slide count against the page count inside the committed PDF, and the docs library's audience count against the distinct `audience` values the docs actually carry. It also sweeps `features/docs/content/` for a count phrase no assertion covers, so a new claim cannot arrive unpinned.

Page counts are read from the PDF bytes, two ways - the page-tree `/Count` and the `/Type /Page` objects - and compared, because a parse that found nothing would agree with any claim. There is deliberately no PDF dependency: a new one would pull `pnpm build` into the gate for a page count. The sweep carries two allow cases lifted from the files themselves ("Step 3 of 5 slide" in alt text, "the whole system on one page"), because an invented allow case cannot catch a guard that is too greedy.

### A public count is measured or it is dated history

Until S57 every number a reader could check sat behind the owner gate. The posts quote the whole platform - merged pull requests and the full suite - and linked to `/docs/engineering-quality`, whose only counts were the email builder's delivery log, scoped to PRs #63-#84. Both were true. Side by side they read as an inflated claim, because nothing public stated the current scale at all.

So that page opens with a "Where the platform is today" section rendered from the committed snapshot, and the delivery log below it is untouched - S56's lesson is that a true sentence gets pinned, not rewritten. `qa/unit/docs/doc-facts.test.ts` holds both halves: the section must carry the snapshot's own pull-request, test and coverage figures, and the historical log must still be there, because a current-state section above it is what makes the smaller figures legible as a subset.

The same file sweeps every **public** doc for a count phrase and fails any figure that is neither a value in the snapshot nor an allow-listed line of recorded history - the four allow cases are lifted from the files with their reasons, since an invented one cannot catch a guard that is too greedy. The section's assertions read the section's own blocks rather than the whole page, because `docText` includes the summary: asserting against that would let the numbers be moved into the summary and the section deleted, which is exactly how S51's changelog guard passed with its entry removed.

Coverage only goes up: the run fails if lines or branches drop below `qa/baselines/coverage.json`. After raising coverage, run `pnpm facts --update-baseline` and commit the new baseline. CI runs `pnpm facts` and uploads the file as an artifact; `pnpm showcase:assets` runs it before rendering.

## Notes

- The unit/integration tests mock `fetch` inline. A future improvement is an MSW-based mock Strapi so the whole app can run in the browser against a simulated CMS before the real instance exists.
- The `axe` suite requires system browser libraries; it may not run in restricted sandboxes. Run it in CI or locally.
- When you change a mapper or schema, run `pnpm test:unit` — it is the fastest signal that a content contract broke.
