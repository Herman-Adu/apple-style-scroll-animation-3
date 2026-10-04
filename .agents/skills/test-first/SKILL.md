---
name: test-first
description: Red-green-refactor for this repo - choose the test layer (Vitest unit or integration, Playwright smoke, seo or axe), write the failing test first, confirm it fails for the right reason, implement, then refactor while green. Use for any feature, bug fix or refactor, "add tests", "TDD", "why is this test failing", or when choosing where a test belongs.
---

# Test first

## The loop

1. **Red.** Write the smallest test that states the behaviour. Run it. It must fail _for the right reason_: missing behaviour, not a typo or a bad import.
2. **Green.** Write the least code that passes.
3. **Refactor.** Clean up with the tests green (see `typescript-clean-code`).
4. Bug fix? First write a test that reproduces the bug.

## Pick the layer

| Behaviour                                      | Layer       | Location                           |
| ---------------------------------------------- | ----------- | ---------------------------------- |
| Pure rule, mapper, schema, formatter           | unit        | `qa/unit/<slice>/*.test.ts`        |
| Server action or query touching Neon           | integration | `qa/integration/<slice>/*.test.ts` |
| Page renders, route guard, critical click path | smoke       | `qa/smoke/*.spec.ts`               |
| Metadata, sitemap, robots                      | seo         | `qa/seo/*.spec.ts`                 |
| Accessibility of a page                        | axe         | `qa/axe/*.spec.ts`                 |

Make it testable by design. Put the rule in a small pure module (`features/<x>/lib/*.ts`, `lib/auth/permissions.ts`) and keep components and actions thin, so most tests are fast unit tests.

## Run

```bash
pnpm test:unit                       # Vitest via qa/config/vitest.config.mts (resolves @/)
pnpm test:unit qa/unit/<slice>       # narrow while iterating
pnpm test:integration
pnpm test:smoke && pnpm test:axe     # always before merge
```

Never call `vitest` without the project config, or `@/` won't resolve.

## Good tests

- Test behaviour through the public API (the slice's `index.ts` or an exported function), not internals.
- One reason to fail per `it`. Name tests as statements: `"rejects a discount above 100%"`.
- Deterministic: no real clock, random numbers or network in unit tests. Inject them or use `vi.useFakeTimers()`.
- Fixtures go in `qa/fixtures/`; reuse them rather than rebuilding objects inline.
- Integration tests clean up the rows they create and never touch rows they didn't create.

## Done means

The new test was red, then turned green. The full unit + integration suites are green. The browser tests are green for any user-visible change.
