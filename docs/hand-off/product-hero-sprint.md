# Product heroes — one data-driven hero, cinematic kept for the front door

Written 2026-10-16. Measured on this tree. This is the brief a fresh terminal
executes **after S68**. Nothing here is a draft.

---

## 1. The finding that shapes everything

`hero` is one field doing two opposed jobs.

- `app/page.tsx:20` renders `<StoryHero product={flagship} />` — the headphones
  frame sequence that is the site's lure.
- `app/products/[slug]/page.tsx:83` renders `<StoryHero product={product} />` —
  the same component, per product.

So the home page borrows momo-x's *product* hero. Keeping the lure and dropping
per-product scrollytelling is therefore not a conflict; it is a **split by
role**, the same move S67 made on `--destructive`.

- **Front door** (home, flagship only): the frame sequence stays. One 16 MB
  sequence, already built, on the page people land on. It earns its weight once.
- **Product pages**: one static, data-driven hero. Server-rendered, no canvas,
  no blocking preload.

**The owner's challenge was right:** a scrollytelling hero per product means
~48 MB across four products, each behind a progress bar, and a frame sequence
to produce per product. One cinematic is a signature; four is a tax.

---

## 2. Current state, measured

| Product | Hero kind | Renderer |
|---|---|---|
| momo-x | `frames` | `FrameScrollHero` (192 frames, 16 MB) |
| momo-air | `parallax` | `ParallaxStoryHero` |
| momo-studio | `parallax` | `ParallaxStoryHero` |
| momo-beat | `exploded` | `ExplodedStoryHero` (5 layer PNGs, ~2.5 MB) |

Four products, three hero kinds, three client renderers — all carrying
framer-motion. `clientComponents` is currently **153**; this sprint should move
it down, and that drop is the sprint's measurable result.

Hero schemas live in `features/products/lib/domain/schema.ts:32` (`frames`),
`:42` (`parallax`), `:63` (`exploded`). Product data is
`features/products/lib/data/data.ts`.

---

## 3. Target shape

Two distinct fields, each honest about its job:

```ts
// The front door. Optional. Only the flagship has one.
cinematicHero: frameHeroSchema.optional()

// Every product has one. Static, server-rendered.
productHero: z.object({
  image: z.string(),          // the staged product shot
  kicker: z.string(),         // "THE SPEAKER" — small, tracked, accent dot
  title: z.string(),          // two-tone, via TwoToneTitle
  subtitle: z.string(),       // one or two lines
  align: z.enum(["left", "right"]).default("right"),  // which side the copy sits
})
```

`parallaxHeroSchema` and `explodedHeroSchema` are deleted, not deprecated.

Layout follows the collection hero the owner supplied: product image on one
side, copy on the other, near-black field, accent used on the second half of
the title and the kicker dot. `TwoToneTitle` already exists
(`components/primitives/two-tone-title.tsx`) and is what gives the collection
hero its two-colour headline — reuse it, do not reimplement.

---

## 4. File-by-file plan

**Delete**
- `components/scroll/parallax-story-hero.tsx`
- `components/scroll/exploded-story-hero.tsx`
- `public/products/beat-exploded/` (5 PNGs, ~2.5 MB)
- `parallaxHeroSchema`, `explodedHeroSchema` and their union members in
  `features/products/lib/domain/schema.ts`

**Add**
- `features/products/ui/product-hero.tsx` — **server component, no `"use client"`.**
  This is the point of the sprint. If it needs a directive, the design is wrong.
- `productHeroSchema` in the existing schema file.
- Four images in `public/products/hero/` (section 6).

**Change**
- `components/scroll/story-hero.tsx` — becomes the flagship-only cinematic
  switch, or disappears entirely if `app/page.tsx` can render `FrameScrollHero`
  directly. Prefer deleting it; one indirection for one case is not worth a file.
- `app/products/[slug]/page.tsx:83` — `<StoryHero>` → `<ProductHero>`.
- `app/page.tsx:20` — render the cinematic explicitly.
- `features/products/lib/data/data.ts` — `productHero` on all four products;
  `cinematicHero` on momo-x only.

**Reuse before building** (`AGENTS.md` non-negotiable 7): `TwoToneTitle`,
`AddToCartButton`, and the existing section/spacing idiom from the product page.
Do not invent a new layout primitive.

---

## 5. Test-first order

0. **The copy-survival test first of all** (section 7). It is written against
   today's strings while they are still on disk, and it is the test that stops
   the migration quietly losing product writing.
1. **Schema test, red.** `productHero` is required on every product; a
   product without one fails parsing. Run it, watch it fail for the right
   reason — four products lack the field.
2. **Union test.** `parallax` and `exploded` are no longer valid hero kinds.
3. **Fix `qa/unit/showcase/scroll-plan.test.ts:136`.** It finds the frames hero
   with `products.find(p => p.hero.kind === "frames")` — singular, and it reads
   `product.hero`. Once the field is `cinematicHero` this breaks; retarget it at
   the flagship's cinematic rather than deleting the coverage.
4. **A server-component guard.** Assert `product-hero.tsx` carries no
   `"use client"`. Cheap, and it is the one rule this sprint exists to hold.
5. Then implement. Then `pnpm facts` (the architecture counts move, and the
   merged-PR recount is red by one at sprint start — that is the guard working).
6. Full gate before merge: `tsc`, lint, `pnpm arch`, unit, integration, smoke,
   seo, axe. Both themes.

---

## 6. The four hero images

One art direction, four shots, so the range reads as one brand. Generate
through the kie connector — Nano Banana Pro, 16:9 at 2K, ~18 credits (~$0.09)
each, **priced and confirmed one at a time** before spending.

Shared direction, in every prompt:

> Studio product photograph on a near-black background, dramatic single-source
> rim light, soft falloff, subtle volumetric haze, the product resting on a dark
> textured stone plinth, shot slightly above eye level, photographic and sharp.
> Generous empty space on one side for text. No text, no logos, no watermarks.

Per product, with its accent as the light colour:

| Product | Subject | Accent |
|---|---|---|
| Momo X | Flagship over-ear headphones, machined titanium frame | `oklch(0.72 0.15 250)` cool blue |
| Momo Air | Wireless earbuds with their open charging case | `oklch(0.78 0.14 190)` cyan |
| Momo Studio | Reference over-ear headphones, warmer finish | `oklch(0.7 0.13 60)` amber |
| Momo Beat | Machined titanium cylindrical speaker, coffee-cup sized, 360° grille | `oklch(0.7 0.16 20)` deep red |

Convert each `oklch` to an approximate colour name in the prompt — models do not
read `oklch`. Keep the staging identical across all four; only the product and
the light colour change. **Generate one, get it approved, then match the other
three to it** rather than generating four and reconciling afterwards.

Note `momo-x.image` is currently `/frames/00096.jpg` — a frame borrowed from the
sequence. It gets a real shot of its own here.

---

## 7. The content must not die with the renderer

**This is the part of the sprint most likely to be done badly.** The animations
are the delivery mechanism, not the content. Every hero carries real product
writing that exists *nowhere else in the repo* — delete the renderer carelessly
and the writing goes with it. The owner has called this out explicitly: the
animation can go, the content cannot.

What is actually in there, per hero:

- **Story beats** — every hero kind has `beats[]`, each with an `index`, a
  two-tone `title` and a `description`. Three per product.
  - Momo Beat: *Every layer engineered.* / *Bass you feel.* / *360° of sound.*
  - Momo Air and Momo Studio: their own three, in the `parallax` blocks.
- **Exploded layer labels** — `explodedHero.layers[].label` on Momo Beat:
  *Titanium cap*, *360° acoustic grille*, *Full-range driver*,
  *Amp & passive radiator*, *Machined base*. These are the component names the
  beat copy refers to. They are product specification, not decoration.
- **Hero intros** — `intro.kicker` / `title` / `subtitle` per product.

**Step one of this sprint, before deleting anything:** inventory every string
in all four `hero` blocks and write them into the sprint's working notes. Only
then start removing renderers. Reconstructing copy from a git diff after the
fact is how writing gets quietly paraphrased into something worse.

**Where it goes.** Beats and layer labels rehome into the existing
`ProductFeatures` / `ProductSpecs` sections further down each product page —
which is arguably where specification belonged all along, since it is readable
there without scrubbing. Intros feed the new `productHero`.

**Guard it with a test, not with care.** Add a unit test holding the exact
strings — every beat title and description, every layer label — asserting each
still appears in that product's data after the migration. Write it *before* the
deletion, so it goes red the moment something is dropped. This is the test that
makes "don't lose the copy" enforceable instead of aspirational.

A sprint that ships the layout and silently drops the writing has not finished,
and will not be merged.

---

## 8. What this sprint explicitly does not do

- It does not build a frame sequence for Momo Beat.
  `docs/hand-off/momo-beat-frame-hero.md` records that path and why it was not
  taken. Do not resurrect it without the owner saying so.
- It does not touch the home page cinematic's frames, loader or timing.
- It does not go live. Stripe stays in test mode; merging is deploying, and
  that is the normal resting state.

---

## 9. Starting prompt for the fresh terminal

> Read `docs/hand-off/product-hero-sprint.md` in full. Section 3 is the target
> schema, 4 the file plan, 5 the test-first order, 6 the images, 7 the copy that
> must be rehomed. Branch `v0/<id>-product-hero` off refreshed `main`. The
> product hero is a **server component** — that is the point of the sprint.
> Price every image generation and wait for the go. S68 lands first.
