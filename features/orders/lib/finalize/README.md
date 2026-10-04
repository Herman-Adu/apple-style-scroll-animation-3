Finalize seam: `orders` vs `stock`

Purpose

- Document the finalize seam split and export rules for `features/orders/lib/finalize`.

Seams

- `orders/` — order creation, order-number, order-row, release, refunds, orchestration.
- `stock/` — stock reservation, commit, restore, low-stock alerts, effective-products.

Rules

- Public entrypoint: keep `checkout-finalize.ts` (or top-level barrel) unchanged for consumers.
- Internal implementation: place files under `orders/` or `stock/` and add an `index.ts` barrel in each seam.
- File size: prefer <= 300 lines per file. If a file grows past 300 lines, split along logical responsibilities.
- Exports: only export named functions/types required by other features. Keep most helpers module-private.
- Imports: prefer importing from the seam index (`./orders` or `./stock`) rather than deep-importing individual files.
- Tests: unit tests should import the public entry or seam indexes when testing behavior that spans modules.

Commit messages

- Use the `r6:` prefix for related commits, e.g. `r6: split finalize — add order-number module`.

Testing checklist

- `pnpm exec tsc --noEmit` passes.
- `pnpm test` (project tests) pass locally.

How to add a new step

1. Decide which seam it belongs to (`orders` or `stock`).
2. Create a new file under the seam and export it from the seam's `index.ts`.
3. Keep lines <=300 and add unit tests under `qa/unit` where appropriate.
4. Run typecheck & tests and commit with `r6:` prefix.
