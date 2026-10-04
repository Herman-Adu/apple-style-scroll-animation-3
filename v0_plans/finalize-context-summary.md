Branch: v0/r6-split-finalize
Status: Typecheck & tests green (local)

Summary:

- Finalize split completed: implementation moved into
  `features/orders/lib/finalize/{orders,stock}` with index barrels.
- Thin re-exports removed where safe; internal imports updated.
- Cross-platform test fixes applied (CWD/path normalization) in `qa/unit`.
- Draft pattern doc: `v0_plans/finalize-pattern.md` exists.

Key files to consult:

- features/orders/lib/finalize/
- v0_plans/finalize-pattern.md
- qa/unit/ (tests that were hardened)

Next actions (minimal, token-efficient):

1. Add `features/orders/lib/finalize/README.md` documenting seams and export rules.
2. Add `scripts/audit-architecture.mjs` to detect large files and deep imports.
3. Open a focused new chat with this file path and a single short task.

Constraints:

- Preserve public API surface.
- Keep each new file <= 300 lines.
- Commit messages prefixed with "r6:"
