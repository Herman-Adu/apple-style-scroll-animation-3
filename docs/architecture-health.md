# Architecture health (W3 baseline)

Measured on `main` at `72f5526` with `pnpm arch` (baseline: `qa/baselines/arch.json`).
No refactors shipped in W3. Each fix below is its own R-sprint, approved before it starts.

## 1. Scorecard

| Metric                             | Baseline | Target                             | Owning R-sprint          |
| ---------------------------------- | -------- | ---------------------------------- | ------------------------ |
| Deep imports into `features/*/...` | 116      | ≤ 10                               | R3                       |
| `lib/` → `features/` inversions    | 16       | 0                                  | R3                       |
| `useEffect`                        | 55       | ≤ 22 (keep-list only)              | R4, R5, R6               |
| `any` types                        | 28       | ≤ 15 now, 0 after the Strapi phase | R7                       |
| `++` incrementers                  | 8        | ≤ 3 (local loop counters only)     | R2                       |
| `"use client"` files               | 154      | ≤ 120                              | R4, R5, R6 (side effect) |
| Files > 300 lines                  | 22       | ≤ 14                               | R3, R6                   |

The ratchet in CI stops any metric getting worse. Each R-sprint lowers its numbers in `qa/baselines/arch.json` in the same PR.

## 2. Top smells

| #   | Smell                         | Where                                                                                                                                            | Why it matters                                                                  | Fix                                                                                                     |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Inverted dependency           | `lib/orders/*`, `lib/catalog/db-actions.ts`, `lib/offers/active-offer.ts`, `lib/contact/submit.ts` import from `features/`                       | `lib/` should be domain-free; today a change in a slice can break "shared" code | Move them into `features/orders`, `features/catalog`, `features/checkout`, and a new `features/contact` |
| 2   | Shared types depend on slices | `lib/types.ts` and `lib/seo/structured-data.ts` import the products/articles schemas                                                             | Hides domain types in a shared bucket                                           | Callers import types from the slice `index.ts`; the SEO builders move to the slices                     |
| 3   | Leaky slices                  | Deep imports: email 46, admin 31, products 23, articles 9, checkout 6                                                                            | Internals can't move without touching every caller                              | Fill in each slice's `index.ts`, rewrite imports, then add a lint rule that bans deep imports           |
| 4   | God file                      | `features/admin/components/email/template-editor.tsx` (1,366 lines)                                                                              | Hard to test; one change re-renders everything                                  | Split into toolbar, block list, inspector, preview, and a pure reducer                                  |
| 5   | God file                      | `lib/orders/checkout-finalize.ts` (570), `features/email/lib/data/repo.ts` (549)                                                                 | Payment, stock, and email all in one function                                   | Split by step: verify, persist, decrement stock, notify                                                 |
| 6   | Effect-driven data            | `features/admin/hooks/use-admin-{orders,customers,discount-codes}.ts`, `hooks/use-orders.ts`, `account-view`, `product-reviews`, `email-manager` | Loading waterfalls, spinners, and duplicated cache logic                        | Fetch in a server component and pass a promise to `use()`; refresh with `updateTag`                     |
| 7   | Hidden module state           | `features/email/lib/domain/blocks/system-templates.ts` `++idc`                                                                                   | Ids depend on call order, which is why a test misbehaves between runs           | Deterministic ids derived from the template key and index                                               |
| 8   | Duplicate hooks               | `hooks/use-toast.ts` and `components/ui/use-toast.ts`; `hooks/use-mobile.ts` and `components/ui/use-mobile.tsx`                                  | Two copies drift apart                                                          | Keep one copy each and re-point imports                                                                 |
| 9   | Client-side guards            | `components/auth/route-guard.tsx`, `features/admin/components/admin-guard.tsx`                                                                   | Protected UI flashes before redirecting; access is checked on the client        | Check the session in the server layout and `redirect()`; `requireAdmin()` stays in actions              |
| 10  | Untyped boundaries            | `lib/auth/adapters/strapi.ts` (8), `features/docs/lib/strapi-source.ts` (7), product/article mappers (7)                                         | Bad CMS data fails deep in rendering, not at the edge                           | Zod schemas at the mapper edge (deferred to the Strapi phase, except non-Strapi ones)                   |

## 3. Seams (where to change things safely)

- **A slice's `index.ts`**: lets imports be redirected without behaviour changes (R3).
- **Server action signatures**: the UI moves to `useActionState` while the action itself is unchanged (R6).
- **`lib/db/prisma`, `features/email/provider`, `lib/stripe`, `lib/auth/server`**: the four outside-world boundaries. These are where the test fakes plug in (R1).
- **`features/products/lib/mappers.ts`, `features/articles/lib/adapters/mappers.ts`**: the only place CMS data enters, so it's the place to validate it.

## 4. `useEffect` triage (55)

Each file was classified by what its effect touches (listeners, storage, timers, router, fetch). The R-sprint that owns each line confirms the class against the real code before changing anything.

| Class                                                                                               | Count | Files                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keep** (syncing with an outside system: DOM, animation, third-party widget, timer, error logging) | 22    | `scroll/frame-scroll-hero` (2), `ui/sidebar`, `ui/carousel` (2), `ui/calendar`, `docs/mermaid-diagram` (2), `admin/stat-card`, `admin/radial-gauge`, `layout/site-header` (3), `layout/mobile-nav`, `hooks/use-active-section`, `use-toast` (2), `contact/opening-hours`, `checkout/embedded-payment`, `app/error`, `app/global-error`, `hooks/use-live-refresh` |
| **`useSyncExternalStore`** (localStorage, media query, theme, auth subscription)                    | 13    | `use-mobile` (2), `layout/theme-toggle`, `lib/cart-context` (2), `lib/auth/auth-context` (2), `admin/admin-settings`, `admin/admin-shell` (4), `account/user-avatar`                                                                                                                                                                                             |
| **Server component + `use()`** (data loading)                                                       | 8     | the three `use-admin-*` hooks, `hooks/use-orders`, `account/account-view`, `products/product-reviews`, `admin/email-manager` (2)                                                                                                                                                                                                                                 |
| **`useActionState` / `key` reset** (form state)                                                     | 5     | `admin/product-form-dialog`, `admin/discount-code-form-dialog`, `admin/admin-onboarding`, `email/template-editor` (2)                                                                                                                                                                                                                                            |
| **Derive or delete** (state computed from props, route, or events)                                  | 7     | `products/scroll-to-results`, `catalog/catalog-context`, `primitives/search-field` (use `useDeferredValue`), `checkout/clear-cart`, `layout/cart-drawer` (close in the link's `onClick`), `auth/route-guard`, `admin/admin-guard` (server redirect)                                                                                                              |

## 5. Test fakes (mocks)

Today there are 22 ad-hoc `vi.mock(...)` calls copied between files (`@/lib/db/prisma` ×4, `next/cache` ×4, `@/lib/auth/server` ×3, and so on). Each test rebuilds its own fake.

The proposal is one kit, `qa/fakes/`, with a fake for each seam in section 3:

| Fake                                   | Replaces                      | Gives tests                                                                                                 |
| -------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `fakeDb()`                             | `@/lib/db/prisma`             | In-memory tables with `seed()` and `reset()`                                                                |
| `fakeEmail()`                          | `features/email/provider`     | An `outbox` array to assert on, plus `failNext()`                                                           |
| `fakeStripe()`                         | `lib/stripe`                  | Sessions and events you can script, and signed webhook payloads                                             |
| `asUser()` / `asAdmin()` / `asGuest()` | `@/lib/auth/server`           | One call sets the session                                                                                   |
| `fakeCache()`                          | `next/cache`                  | Records `updateTag` and `revalidateTag` calls                                                               |
| `fakeHttp(baseUrl)`                    | any `fetch` to an outside API | Route handlers you can script. This is where Strapi plugs in later; nothing Strapi-specific gets built now. |

Rule: integration tests use the fakes by default. Only tests tagged `@neon` hit the real database (and need the `DATABASE_URL` secret in CI).

## 6. Proposed R-sprints (in order)

Each follows the usual loop: branch from fresh `main`, failing test first, all checks green (including browser tests), squash-merge, refresh `main`.

| Sprint                                        | Outcome                                                                                                                                                          | Metrics moved                                              | Acceptance                                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **R1: Test fakes kit**                        | `qa/fakes/` from section 5; the existing 22 `vi.mock` calls migrated                                                                                             | none (enabler)                                             | Every integration test passes unchanged in behaviour; no direct `vi.mock("@/lib/db/prisma")` left |
| **R2: Deterministic ids and duplicate hooks** | `++idc` replaced; one `use-toast` and one `use-mobile`                                                                                                           | incrementers 8 → ≤ 3                                       | Snapshot of system templates is stable across runs; the misbehaving test is fixed                 |
| **R3: Slice boundaries**                      | `lib/orders`, `lib/catalog`, `lib/offers`, `lib/contact` moved into slices; `index.ts` exports completed; `checkout-finalize` split; lint rule bans deep imports | inversions 16 → 0, deep imports 116 → ≤ 10, large files −2 | `pnpm arch` shows the new numbers; the checkout integration tests pass unchanged                  |
| **R4: Server data for admin and account**     | The 8 "server + `use()`" effects removed; `updateTag` after mutations                                                                                            | useEffect −8, client files down                            | Admin pages render data with no loading flash; smoke and axe stay green                           |
| **R5: External stores and server guards**     | The 13 `useSyncExternalStore` cases, plus route and admin guards moved to server redirects                                                                       | useEffect −15                                              | No hydration warnings; a protected page never renders for a guest                                 |
| **R6: Forms and template-editor split**       | The 5 form effects replaced with `useActionState` / `key`; `template-editor` split into 5 files under 300 lines; the other derivable effects removed             | useEffect −10, large files −1                              | Unit tests on the editor reducer; email-editor smoke test green                                   |
| **R7: Typed boundaries (non-Strapi)**         | Zod at `discount-codes`, `timeline`, and product/article API edges                                                                                               | any 28 → ≤ 15                                              | Malformed input fails with a typed error at the edge (unit tests)                                 |

After R7, run the final gap analysis, then S5 (template handover).

## S5 final gap analysis

Status: template handover complete.

Compared with the W3 baseline and shipped R/SEC sprint ledger, the architecture goals for this repository are closed as a reusable template rather than a production launch artifact:

| Metric            | Baseline | Final (`pnpm arch`) |
| ----------------- | -------- | ------------------- |
| deepImports       | 0        | 0                   |
| libToFeatures     | 0        | 0                   |
| routePropDrilling | 0        | 0                   |
| useEffect         | 45       | 32                  |
| anyTypes          | 28       | 0                   |
| incrementers      | 3        | 3                   |
| clientComponents  | 151      | 151                 |
| largeFiles        | 21       | 21                  |

- Structural debt targets have dedicated shipped sprints (R1-R9) with guard tests and CI ratchets.
- Auth/origin hardening work is shipped and tracked (SEC1, SEC2) for stable demo/template behavior.
- Remaining productionization work is intentionally outside this repository's scope and belongs to fork-specific launch planning.

### Full `useEffect` look (Oct 5, 2026)

Current code scan (`app/components/features/hooks/lib`) finds **32** `useEffect` occurrences.

| Class                                                                    | Count | Decision                                                                       |
| ------------------------------------------------------------------------ | ----: | ------------------------------------------------------------------------------ |
| Keep (external system sync: DOM, listeners, timers, third-party widgets) |    23 | Keep as `useEffect`                                                            |
| Replace with server data + server redirect                               |     3 | Move auth/guard redirect logic to server layouts/pages                         |
| Replace with `useSyncExternalStore`                                      |     3 | External store subscriptions (`matchMedia`, listener stores, scroll snapshots) |
| Replace with event handler                                               |     2 | Persist/write side-effects at event time instead of reactive effect            |
| Replace with key-reset/remount pattern                                   |     1 | Remove timer-driven mount animation state                                      |

Top low-risk replacements for a next station:

1. `hooks/use-toast.ts` → `useSyncExternalStore` subscription.
2. `hooks/use-mobile.ts` → `useSyncExternalStore` over `matchMedia`.
3. `features/admin/components/admin-shell.tsx` sidebar preference write → do it in toggle handler.
4. `components/layout/site-header.tsx` scroll subscription → `useSyncExternalStore`-style scroll store hook.
5. `features/admin/components/radial-gauge.tsx` timer effect → `key` remount / pure CSS mount animation trigger.

High-value guard migrations (server-side redirects):

- Replace client guard logic in `components/auth/route-guard.tsx` and `features/admin/components/admin-guard.tsx` with server redirects in corresponding route layouts/pages.
- This aligns with Next.js 16 server-first routing and removes protected-UI flash risk.

Final delta conclusion: no additional in-repo architecture refactor sprint is required before handover; future work should be fork-specific customization and production readiness.
