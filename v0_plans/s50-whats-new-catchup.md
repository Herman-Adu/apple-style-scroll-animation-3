# S50: What's New catches up, and stays caught up

Branch: `v0/s50-whats-new-catchup`. Data impact: **none**.

## Why

`features/docs/content/whats-new.ts` records PRs up to **#169** and then jumps
to **#187**. Everything between is missing: eleven merged sprints, including the
whole showcase and marketing run the launch collateral is built on.

This is not a one-off backlog. The last time the page was brought current was
**S37 (#170), a docs audit sprint** — the changelog has drifted on every sprint
since, because nothing fails when a sprint ships without an entry. The existing
guards hand-list PR numbers:

```ts
it.each(["#101", "#103", "#106", "#114", "#121", "#122", "#124", "#146"])(
  "the changelog records PR %s", ...)
```

A list written by hand can only check the past. Sprint S50 is the fourth time
the same page has been caught up by hand (S20, S37, and the S41–S46 gap noted in
the S48 handoff), so the sprint fixes the mechanism, not just the page.

The deadline is real: the posting calendar from S45 links `/docs/whats-new` on
**Wed 14 Oct 2026**.

## What this sprint adds

1. **Eleven changelog entries**, one per merged sprint from S38 to S49, written
   from the ledger rows in `docs/next-steps.md`.
2. **A derived guard.** `docs/next-steps.md` is the source of truth for what is
   on `main`. The test parses its sprint ledger and fails when a sprint row at or
   after the coverage floor has no PR reference anywhere in the What's New body.
   A sprint that ships without a changelog entry now goes red.
3. **A snapshot guard.** The same test asserts the "Current handoff snapshot"
   section names the newest sprint in the ledger. This sprint also corrects it:
   it still reads "`main` is at S48" although S49 (#194) merged and was closed
   out in #195.

## The decisions behind it

**The coverage floor is S38, and it is pinned by a test.** S37 (#170) was the
last catch-up sprint, so S38 is the first sprint that should have been recorded
and was not. Everything before S38 stays as it is: a curated changelog, grouped
by theme, that deliberately summarises internal churn (ledger syncs, continuity
guards, refactor steps) rather than listing every PR. The floor is exported as a
named constant and a test asserts its value, so weakening the guard by raising
the floor is a visible change in a diff rather than a quiet edit.

**The guard reads the ledger, not a list.** The ledger already carries sprint,
PR and merge SHA per row and is updated immediately after every merge — that is
step 4 of the non-negotiables. Deriving from it means the guard needs no
maintenance, in the same way S48's site-map slides derive from the app's own
navigation instead of a hand-written list.

**Parsing stays pure.** `features/docs/lib/domain/changelog.ts` takes markdown
and changelog text as strings and returns data. Only the test touches the
filesystem, so the domain layer keeps its no-`fs` rule.

**Only `S<n>` rows count.** The ledger also holds `Locks`, `D1`–`D6`, `W26`,
`SEC1`, `SEC2`, `S0 archived` and suffixed rows like `S25a`/`S33b`. The guard
matches `S<number>` with an optional letter suffix and compares by number, so it
does not depend on row order and does not demand changelog entries for the
documentation and security series that are already covered by theme.

**The entries are written for the page's audience.** What's New is a CTO-audience
doc with a `PR | What shipped | Why it matters` table. Each new row says what a
reader gets, not what the sprint was called internally.

## Test plan

New file `qa/unit/docs/changelog-coverage.test.ts`:

- parser unit tests against a small inline ledger fixture: reads sprint, PR and
  SHA; handles a multi-PR cell (`#92, #93`); skips the header, the separator and
  non-`S<n>` rows
- `sprintNumber` ignores `Locks`, `D1`, `W26`, `SEC1`; reads `S25a` as 25
- the floor constant is 38
- **guard:** no sprint from S38 on is missing from the real What's New body
- **guard:** the handoff snapshot names the newest sprint in the real ledger

Layer: unit. The behaviour is pure parsing plus two repo-content assertions, so
no browser test is needed. `pnpm test:smoke` and `pnpm test:axe` still run before
merge because the docs page content changes.

## Out of scope

- Backfilling S20–S37 into the changelog.
- The in-app ADR list and the glossary: separate docs, no drift found.
- Any production deploy. The live site does not follow `main` and promotion is a
  gate.
