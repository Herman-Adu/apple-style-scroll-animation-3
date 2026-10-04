## Finalize seams pattern (orders / stock)

Goal

- Make the checkout finalize codebase a clear, testable seam with two orthogonal responsibilities:
  - `orders` — order creation, numbering, row mapping, refunds and release orchestration.
  - `stock` — product availability, reserve/commit/restore, low-stock alerts.

Principles

- Single Responsibility: each file contains one cohesive unit under 300 lines.
- Boundary Barrels: `features/<feature>/lib/finalize/orders/index.ts` and `.../stock/index.ts` export implementation; top-level files under `finalize/` remain thin public barrels only if external code imports them. Prefer updating internal callers to the subfolder.
- Tests mirror seams: unit + small integration tests target one seam only (orders OR stock). Cross-seam integration tests live in `qa/integration/checkout-finalize`.
- Keep public API stable: maintain thin top-level re-export files during transition; delete them only after repo-wide search and update of imports.

Directory layout (recommended)

- features/orders/lib/finalize/
  - checkout-finalize.ts <- public orchestrator (re-exports from subfolders)
  - orders/
    - index.ts <- exports: finalizeCheckout, nextOrderNumber, reconcileRefund, releaseReservationById, toOrder, types
    - finalize.ts <- orchestration for paid session -> order
    - order-number.ts
    - order-row.ts
    - release.ts
  - stock/
    - index.ts <- exports: effectiveProductsFor, commitStock, restoreStock, notifyLowStock, types
    - effective-products.ts
    - commit-stock.ts
    - restore-stock.ts
    - low-stock.ts

Tests layout

- qa/integration/checkout-finalize/ : cross-seam integration proving concurrency and idempotency
- qa/unit/orders/finalize/ : unit tests for `orders/*` functions (mapping, numbering, refunds)
- qa/unit/orders/stock/ : unit tests for `stock/*` helpers (effectiveProductsFor, commitStock, restoreStock, low-stock notifications)

Refactor checklist (small, safe steps)

1. Create `orders/` and `stock/` folders and move implementations (done).
2. Add `index.ts` barrels inside `orders/` and `stock/` (done).
3. Replace internal imports to reference subfolders (orders/_ and stock/_) rather than thin root barrels (done for finalize). Keep top-level barrels for external compatibility.
4. Add/adjust unit tests to target seam files directly (write small unit tests where missing).
5. Run full test suite; fix brittle tests (paths, CWD, environment) — we fixed several already.
6. When green, run a repo-wide search for imports of the old top-level paths; update them to subfolder barrels and delete thin re-exports in a single PR.

Automated checks to run

- `pnpm exec tsc --noEmit`
- `pnpm exec vitest -c qa/config/vitest.config.mts --run`
- Playwright smoke tests in `qa/smoke` if available.

Next immediate actions I will take

1. Audit `features/*/lib` for files >300 lines and list candidates for seam extraction.
2. Produce a short PR plan: (A) finalize pattern applied to `orders` (B) tests moved/added (C) delete thin barrels and finalize.

If this pattern looks good I will implement step 1 (repo audit) and then prepare the `orders`-focused PR applying the pattern and tests changes.

— End
