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

## How the layers map to the architecture

- **Unit / mappers** are the highest-value tests for the CMS migration. They pin the contract between Strapi's field shapes and the domain schemas. If a content-type drifts, these fail before anything ships. Keep them current as content-types evolve.
- **Unit / strapi-client** covers the hardened transport: timeouts, retry/backoff on 5xx and network errors, fail-fast on 4xx, and `{ data }` unwrapping.
- **Integration / features** exercises the seam itself — that the local branch and the Strapi branch (with `fetch` mocked) both return identical validated types.
- **Integration / revalidate-route** verifies the webhook maps models to the right cache tags and rejects bad/missing secrets.
- **Unit / email** pins every pure editor rule in `features/email/*` — version pruning, saved-section picking and validation, starter shape (unique ids, valid groups, hero images exist), and locked-block behaviour (no edits/moves/deletes, insertion above trailing locks). Write these first when adding an editor feature; the UI only calls these functions.
- **Integration / email** and **integration / checkout-finalize** run against the database and verify reset-to-original and the post-checkout email/order flow.
- **Smoke / SEO / axe** are Playwright suites that run against the dev server for real-browser guarantees.

## Facts and the coverage ratchet

`pnpm facts` runs unit + integration with coverage, lists the Playwright tests, measures the architecture and writes `.generated/facts.json` (git-ignored). Every number on a showcase slide is read from that file; a unit test fails if a slide types a number in instead of using `{ fact: "..." }`.

Coverage only goes up: the run fails if lines or branches drop below `qa/baselines/coverage.json`. After raising coverage, run `pnpm facts --update-baseline` and commit the new baseline. CI runs `pnpm facts` and uploads the file as an artifact; `pnpm showcase:assets` runs it before rendering.

## Notes

- The unit/integration tests mock `fetch` inline. A future improvement is an MSW-based mock Strapi so the whole app can run in the browser against a simulated CMS before the real instance exists.
- The `axe` suite requires system browser libraries; it may not run in restricted sandboxes. Run it in CI or locally.
- When you change a mapper or schema, run `pnpm test:unit` — it is the fastest signal that a content contract broke.
