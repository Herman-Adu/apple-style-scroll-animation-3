# S71 — the amber and emerald literals on the product detail page

Written 2026-10-17, after S70 (#236) merged as `191fe86`. **Start here in a
fresh terminal.** This file is uncommitted on purpose: it rides into `main`
with S71's own PR, the way S70's brief did. There is no closeout PR.

A small, contained sprint. One component, three classes, one or two tokens.

---

## 1. The defect

A product detail page has a one-line availability row: a coloured dot, then
words. Three colours in it are raw Tailwind defaults, all in
`features/products/components/product-purchase.tsx`:

| What a buyer reads | Class | Line | Floor |
|---|---|---|---|
| "Only N left" | `text-amber-500` (in `stockTone`) | 14 | 4.5:1 |
| low-stock dot | `bg-amber-500` | 77 | 3:1 |
| in-stock dot | `bg-emerald-500` | 78 | 3:1 |

Measured on this tree with `qa/config/contrast.ts`:

```
light   amber    2.05 on --background    1.88 on --muted    2.15 on --card
light   emerald  2.36 on --background    2.16 on --muted    2.46 on --card
dark    amber    9.79 / 9.17 / 9.76
dark    emerald  8.52 / 7.98 / 8.50
```

Dark is comfortable. Light is roughly half of what each needs. These are
dark-tuned Tailwind defaults, and the light theme was not scanned at all before
S66.

**Why nothing caught it.** Every colour guard in this repo resolves *tokens*.
`text-amber-500` names no token, so there is nothing to resolve and the guards
stay green while the text is unreadable. Same blind spot as the `emerald-300`
badge S66 found at 1.25:1.

## 2. Three corrections to the candidate as `docs/next-steps.md` writes it

Measured after that bullet was written. Fix the bullet in S71's PR.

1. **`--warning` is not the answer, and the ledger says to reach for it.** It
   reads `2.43:1` on `--background` and `2.23:1` on `--muted` in light —
   **also under AA**. It is a dark-tuned amber too (`L 0.72` light, `L 0.80`
   dark). Re-pointing the class at the existing token fixes nothing. The token
   needs a real light value, or a role split.
2. **Three literals, not "two sites".** The amber is used twice — once as text,
   once as a dot — and those have *different* floors (4.5:1 and 3:1). That is
   the S67 shape exactly: one value doing two opposed jobs. Expect
   `--warning` (fill/dot) plus a text sibling, the way `--destructive` became
   `--destructive` + `--destructive-strong`. **Measure the constraint before
   adopting that shape** — S67's handoff asked for a per-theme split and the
   measurement proved no single per-theme value could work.
3. **Nothing is untracked any more.** The owner deleted
   `public/brand/herman.jpg` on 2026-10-17 — it was only ever there so an agent
   could see his face while generating banners, and that work is done. The
   "One file is untracked on purpose" bullet is now false and should be
   removed, not reworded. (`public/brand/` still holds the two tracked
   wordmarks.)

## 3. Check this before writing a fix

**A scanned route only speaks for the states its data puts on screen.** S67
went to measure the "Sold out" tag and it was not rendered at all; S69 scanned
`/contact` for a year without seeing the "Closed" pill.

The seed (`features/products/lib/data/data.ts`) says both states exist:

| Product | stock | threshold | state |
|---|---|---|---|
| momo-studio | 4 | 6 | **low-stock → amber** |
| momo-air | 42 | 8 | in-stock → emerald |
| momo-beat | 15 | 5 | in-stock → emerald |
| momo-x | 0 | 5 | preorder (neither) |

**But the served catalog comes from the database, not the seed** — that is the
whole of the S67 lesson. So: `curl` `/products/momo-studio` and
`/products/momo-air` and confirm the amber and the emerald are actually in the
HTML before writing a browser assertion about either. If the database has
momo-studio above its threshold, the amber state is unreachable by `qa/axe`
and the proof has to be a unit measurement instead.

Both answers are fine. Pick the layer from what you find, and say which in the
PR.

## 4. Scope

- One component: `features/products/components/product-purchase.tsx`.
- Do not sweep "all amber" across the repo. The low-stock *badge* on the
  listing is a different surface and is already fine at 10.45:1
  (`bg-amber-500/90 text-black`). The admin and account badges
  (`order-card.tsx`, `customer-badges.tsx`, `analytics-panel.tsx`) are out of
  scope — they are staff surfaces, not a buyer's page.
- A token a client can re-theme must not be able to make an availability
  message unreadable. S67 deliberately kept the destructive roles out of the
  theme editor; follow that.
- Gate: none. Data impact: none. No schema change.

## 5. Also owed, and small

- **S70's merge SHA.** The ledger row for S70 reads `PENDING` by design — a PR
  cannot record its own squash commit. Fill it in with S71's first commit:
  it is `191fe86`.
- **Two retro items from S70 that had nowhere to ship**, because the
  no-closeout-PR rule landed in the same sprint. Take them if they are cheap,
  defer them deliberately if not:
  - The tracked `pre-commit` hook should refuse `public/brand/herman.jpg` by
    path. `git add -A` staged it during S70 and it was caught by eye; the same
    pattern swept `banner-images-next-session.md` onto `main` in S69a. Catching
    it by eye is not a control. (Still worth doing even though the file is now
    deleted — it is the *pattern* that recurs.)
  - `pnpm health` does not report occupied ports. A stale `next dev` held 3000
    during S70 and answered a product-page request with three-sprint-old code
    before anyone noticed.

## 6. The rule S70 paid for, which applies here

S70's brief offered "accept the client component and update the guard" as a
fallback. Measuring *why* the constraint existed first turned the trade-off
into no trade-off, and the fallback would have deleted a true guard to pay a
cost that did not need paying.

So here: the ledger tells you `--warning` exists and to look there. It does
exist, and it is also broken on light. **Ask what a constraint is made of
before designing around it**, and treat a guard or a token you are about to
accept at face value as evidence you have not measured yet.

## 7. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch
`v0/s71-contrast-literals` off a freshly fetched `origin/main`. Test first.
**No standalone closeout PR** — S71's ledger row, its What's New entry, S70's
merge SHA and the three corrections in section 2 all ride in S71's own PR
(skill step 6).
