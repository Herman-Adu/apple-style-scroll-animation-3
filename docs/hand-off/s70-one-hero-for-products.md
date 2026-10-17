# S70 — one hero for `/products` and every product page

Written 2026-10-17, after S69 (#234) shipped and the owner rejected the result
on sight. **Start here in a fresh terminal.** This file is uncommitted on
purpose: it rides into `main` with S70's own PR, not with a CI run of its own.

---

## 1. Why this sprint exists

S69 gave each product page a bespoke `productHero` — a square shot beside the
copy. Looking at it live, the owner's verdict was that it **reads as the product
card, not as a hero**: same framing, same square image, less detail than the
card sitting directly beneath it. The `/products` collection hero, by contrast,
reads as a proper hero — full-bleed image, large two-tone headline, generous
field.

So the direction reverses. **Do not generate any more images.** The remaining
three hero shots from `docs/hand-off/product-hero-sprint.md` section 6 are
cancelled, not deferred.

> The owner's words: "it looks just like the product card below with less
> detail and dont look like a hero... i want the old image put back... we should
> just have the product page here as the hero for all products... so we only
> need 1 hero for products and product pages."

## 2. What to do

**One hero treatment, used in two places.** `/products` keeps exactly what it
has now. Each product page gets the *same* treatment, with its own product's
words and picture in it. Nothing bespoke per product beyond the content.

### Step 1 — revert Momo X's image

`features/products/lib/data/data.ts`: momo-x's `image` and its hero image are
both `/products/hero/momo-x.jpg` (S69's generated shot). Put both back to:

```
/frames/00096.jpg
```

Then delete `public/products/hero/momo-x.jpg`. The generated shot is the wrong
colour and the owner does not want it.

### Step 2 — reuse the existing hero

The collection hero is:

- **Data**: `pageHeroes.products` in `lib/data/heroes.ts` — the
  `PageHeroContent` shape (`eyebrow`, `title`, `titleAccent`, `subtitle`,
  `image`, `imageAlt`, `align`, `layout: "split"`).
- **Renderer**: `PageHero` in `components/layout/page-hero.tsx`, rendered at
  `app/products/page.tsx:54`.

Make product pages render that same component. The content per product maps
cleanly onto it and already exists:

| `PageHeroContent` | Source on the product |
|---|---|
| `eyebrow` | `productHero.kicker` (`Introducing`, `Sound everywhere`, …) |
| `title` | `productHero.title` |
| `titleAccent` | the product name's last word, or leave to `TwoToneTitle`'s auto-accent |
| `subtitle` | `productHero.subtitle` |
| `image` / `imageAlt` | the product's existing shot |

**Measure before choosing the shape.** Two honest options, and the tree decides:

1. Build the `PageHeroContent` from the product and render `PageHero` directly.
   Least new code. Check whether `PageHero`'s layout gives room for the
   `AddToCartButton` a product page needs.
2. Keep a thin `ProductHero` that renders `PageHero` plus the buy button.

### Step 3 — the thing that will catch you out

**`components/layout/page-hero.tsx` is a client component** (`"use client"` on
line 1). S69's whole measurable result was `clientComponents` 153 → 150, and
`qa/unit/products/product-hero-is-server.test.ts` asserts the product hero is
server-rendered. Reusing `PageHero` as-is on four product pages puts a client
component back on every one of them.

So decide deliberately and say which you chose in the PR:

- **Preferred**: find out *why* `PageHero` needs the directive. If it is only an
  entrance animation, split the static markup into a server component and keep
  the motion as a small client leaf — then both pages get the server win.
- Otherwise: accept the client component, and update
  `product-hero-is-server.test.ts` and `qa/baselines/arch.json` rather than
  leaving a guard asserting something no longer true. **Do not delete that test
  silently.**

### Step 4 — what must not regress

`qa/unit/products/hero-copy-survives.test.ts` pins every string that used to
live in the deleted scroll heroes. It has already caught two real losses. It
must stay green; the copy may move again, it may not disappear.

## 3. Scope

- No image generation. No spend. The three outstanding hero shots are cancelled.
- Do not touch the home page cinematic (`cinematicHero`, `FrameScrollHero`).
  That one is working and the owner likes it.
- Do not reinstate `ParallaxStoryHero` or `ExplodedStoryHero`.

## 4. The closeout runs differently from now on

The owner challenged the cost and he is right: S69 cost **two full CI runs** —
one for the sprint, one for a docs-only closeout PR (S69a, #235) that only
added a ledger row, a changelog entry and a handoff block.

`.agents/skills/sprint-workflow/` step 6 already says the ledger row *"rides
with the next sprint's PR"*. S67c, S68a and S69a all broke that rule. From S70:

- **No standalone closeout PR.** S69a's pattern is retired.
- S70's own PR carries: S70's ledger row, S70's What's New entry, **and S69's
  merge SHA** if anything still needs filling in.
- One push per sprint where possible — CI already runs twice per merge
  (`pull_request` and `push: main`), so every extra push is four runs, not two.

Also still open and **gated** (ask, do not change): the owner does not want a
Vercel preview stage while he is the only person working on this, and Vercel
deploys on push before Actions finish, so a preview can be built from a red
tree. Options are listed in the "Next session starts here" block in
`docs/next-steps.md`.

## 5. One correction owed to `docs/next-steps.md`

That block says two files are untracked on purpose. Only one still is
(`public/brand/herman.jpg`).
`docs/hand-off/banner-images-next-session.md` was swept into S69a's commit by a
`git add -A -- docs` and is now tracked on `main`. Harmless in itself — it is a
spent prompt with nothing sensitive — but fix that sentence in S70's PR so the
handoff stops describing a state that is no longer true.
