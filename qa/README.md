# QA

All tests live here, partitioned by **type** rather than colocated with source.
One discoverable QA surface; two runners pointed at the folders they own.

```
qa/
  config/            # runner config + setup + module stubs
  fixtures/strapi/   # hand-written Strapi { data, meta } payloads
  unit/              # pure logic, no I/O            (Vitest, fast)
    mappers/         #   Strapi raw -> domain -> zod  (migration safety net)
    strapi-client/   #   timeout / retry / fail-fast / envelope unwrap
    seo/             #   structured-data + base-url / absoluteUrl
  integration/       # several modules together, mocked fetch (Vitest)
    features/        #   api layer: Strapi path + local-data fallback
    revalidate-route/#   webhook secret gate + tag busting
  smoke/             # every route 200s + renders, no console errors (Playwright)
  seo/               # sitemap / robots / rss / canonical / OG / JSON-LD (Playwright)
  axe/               # WCAG 2 A/AA scans per route (Playwright + axe-core)
```

## Running

```bash
pnpm test           # unit + integration (Vitest, watch off)
pnpm test:unit      # unit only
pnpm test:integration
pnpm test:watch     # Vitest watch mode
pnpm test:e2e       # smoke + seo + axe (Playwright, starts the dev server)
pnpm test:smoke     # smoke only
pnpm test:seo       # seo surfaces only
pnpm test:axe       # accessibility only
```

- **Vitest** (unit + integration): no browser, `@/` path aliases resolve to source,
  `server-only` is stubbed, and env is faked in `config/setup`. The module
  registry resets between tests so env-switched modules re-evaluate cleanly.
- **Playwright** (smoke + seo + axe): boots the app via `webServer` and runs real
  requests. Detail-page slugs are read from `/sitemap.xml` so specs track the
  live data source (local today, Strapi later) instead of hardcoded slugs.

## Conventions

- Unit/integration files end in `.test.ts`; browser specs end in `.spec.ts`.
- Fixtures are the single source of realistic CMS payloads — the mapper tests
  and the api integration tests share them, so drift shows up in one place.
- Add a new feature? Drop a fixture in `fixtures/strapi/`, a mapper test in
  `unit/mappers/`, and an api test in `integration/features/`.
