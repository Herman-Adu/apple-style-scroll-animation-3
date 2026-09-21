# Testing

The QA suite lives in `qa/` and is split by test type. Configs live in `qa/config/`.

```
qa/
  config/         vitest.config.mts, playwright.config.mts
  unit/           Pure logic — fast, no network, no browser
    mappers/      Strapi raw shape -> domain shape (contract tests)
    seo/          site-url resolution, structured data
    strapi-client/ fetchStrapi transport (timeout, retry, unwrap, errors)
  integration/    Modules wired together with fetch mocked
    features/     product api seam (local vs Strapi branch)
    revalidate-route/ webhook -> tag invalidation
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
- **Smoke / SEO / axe** are Playwright suites that run against the dev server for real-browser guarantees.

## Notes

- The unit/integration tests mock `fetch` inline. A future improvement is an MSW-based mock Strapi so the whole app can run in the browser against a simulated CMS before the real instance exists.
- The `axe` suite requires system browser libraries; it may not run in restricted sandboxes. Run it in CI or locally.
- When you change a mapper or schema, run `pnpm test:unit` — it is the fastest signal that a content contract broke.
