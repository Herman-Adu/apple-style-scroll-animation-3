# Momo Beat — replace the exploded hero with a real frame sequence

> **SUPERSEDED on 2026-10-16, the day it was written. Do not execute this.**
>
> This brief answers "can we match the headphones animation on the Momo Beat
> page" — and the answer is yes. The owner then asked the better question: *why
> would every product carry one?* A scrollytelling hero per product is ~48 MB
> across four products, each behind a blocking preload, plus a frame sequence to
> produce per product.
>
> The decision: keep the cinematic on the **home page only**, and give product
> pages one static, data-driven, server-rendered hero.
> **`docs/hand-off/product-hero-sprint.md` is the live brief.**
>
> This file is kept as the record of a road not taken, and because sections 2
> and 3 are the only written description of how the frame engine and its asset
> contract actually work. Read it for that. Do not build from it.

Written 2026-10-16, before any code. Nothing here is a draft. Measured on this
tree, not recalled.

---

## 1. The verdict: yes, and it is smaller than v0 made it look

v0 was honest that it could not do frames, and then built the next best thing it
could do in CSS. That is why the Momo Beat hero slides five PNG layers apart
while the Momo X hero genuinely flies a camera through a disassembling pair of
headphones. They are not two attempts at one technique. They are two different
techniques, and **the good one is already in this repo and already generic.**

`components/scroll/frame-scroll-hero.tsx` (261 lines) preloads a numbered JPEG
sequence, draws the frame matching scroll progress onto a canvas, and overlays
the story beats. It reads everything it needs from data:

```ts
hero: { kind: "frames", framePath: string, frameCount: number, scrollVh: number, intro, beats }
```

It is not hard-wired to the headphones. `framePath` is just `/frames/`. Point a
second product at a second folder and it works.

**So the code change is a data change.** The engineering is near zero. The whole
job is producing the frames.

---

## 2. What exists today

| Thing | Where | Detail |
|---|---|---|
| The engine | `components/scroll/frame-scroll-hero.tsx` | Generic, proven |
| The headphones sequence | `public/frames/` | 192 × JPEG, `00000.jpg` → `00191.jpg`, **1920×1080**, ~81 KB average, **16 MB total** |
| Momo X hero data | `features/products/lib/data/data.ts:18` | `kind: "frames"`, `framePath: "/frames/"`, `frameCount: 192`, `scrollVh: 500` |
| Momo Beat hero data | `features/products/lib/data/data.ts:269` | `kind: "exploded"`, five layer PNGs |
| Momo Beat layer art | `public/products/beat-exploded/` | `01-cap` … `05-base`, PNG, ~2.5 MB total |
| Hero schemas | `features/products/lib/domain/schema.ts:32` | `frames`, `parallax`, `exploded` |

Hero kinds in use: `frames` (momo-x), `parallax` (momo-air, momo-studio),
`exploded` (momo-beat **only**).

---

## 3. The asset spec — match this exactly

The new sequence must match the headphones sequence or it will not read as the
same standard:

- **Path:** `public/products/beat-frames/`
- **Naming:** `00000.jpg` … `00191.jpg` — five digits, zero-padded, zero-indexed.
  `getFramePath` builds this with `padStart(5, "0")`; any other naming silently
  loads nothing and the loader sits at "Loading 100%" with the red
  "No images loaded" message.
- **Resolution:** 1920×1080.
- **Format:** JPEG. Keep the average near 80 KB; the whole folder should land
  around 16 MB.
- **Count:** 192 is the precedent. The renderer takes any count, but the scroll
  test below asserts `> 100`.
- **Motion:** must start assembled, end fully exploded, and be *monotonic* —
  scrubbing is linear against scroll, so any back-and-forth in the source reads
  as a stutter the user cannot scrub past.
- **Background:** near-black, matching `bg-media`, so the beat overlays'
  bottom gradient blends rather than banding.

---

## 4. Producing the frames — the actual work

Four routes, with the trade honestly stated.

**A. Composite the five existing layer PNGs programmatically.** Interpolate each
layer between its `assembledY` and `explodedY` across 192 frames and write them
out with ffmpeg or sharp. **Free, deterministic, perfect part fidelity** — the
parts are the real product art, so nothing drifts. But the motion is still a 2D
slide, just pre-rendered. It would be smoother than today and no more cinematic.
*Pick this only if the goal is reliability over spectacle.*

**B. AI video, one shot.** Image-to-video from the assembled speaker render
(Seedance 2.0 or Kling 3.0 via the kie connector), prompting a slow orbit and
explode, then extract frames. **This is the one that matches the headphones
look** — real camera movement, depth, parts hanging in space. Risk: video models
do not hold mechanical part identity well; an exploding speaker can morph its
own components mid-flight. Expect several attempts.

**C. Keyframes, then interpolate — recommended.** Generate 3–4 keyframes with
Nano Banana Pro (assembled → quarter → half → fully exploded), then use
Seedance's first-frame + last-frame transition to produce each segment between
consecutive keyframes, concat, and extract. Part fidelity comes from the image
model, motion smoothness from the video model, and each segment is short enough
that drift has no room to accumulate. More steps, but each step is checkable and
cheap to redo in isolation.

**The owner has confirmed the existing art is not binding** (2026-10-16): the
speaker may be redesigned outright rather than reconstructed from
`public/products/beat-exploded/`. That matters, because those five PNGs are flat
2D layers built for a slide, and the headphones sequence is a lit 3D scene with
depth, floating hardware and visible internals. Reference art good enough for
route A is a ceiling on route C, not a help.

So the first step is **a hero keyframe designed to the Momo X standard** —
machined titanium body, near-black backdrop, dramatic rim light, visible driver
and internals — generated clean. Once that frame is approved it becomes the
anchor: every other keyframe takes it as a reference so the product stays one
object across the sequence, and the first frame of the final sequence *is* the
assembled product shot. The product's agreed character is fixed even though the
art is not: a machined titanium cylinder, 360° radial array, roughly the size
of a coffee cup, with the five named components (titanium cap, acoustic grille,
full-range driver, amp and passive radiator, machined base). Those names appear
in the beat copy, so whatever is drawn must plausibly be those five parts.

A redesign also frees the colour. The page accent is
`oklch(0.7 0.16 20)` — the deep red behind the current hero — and the new
sequence should be lit to sit with it.

**D. Real 3D.** Blender or Spline, render 192 frames. Best possible result,
total control, and almost certainly how the headphones sequence was made — its
provenance is not recorded anywhere in this repo. Needs a 3D model of the
speaker, which does not exist.

**Recommendation: C**, falling back to A if part fidelity cannot be held. Price
every generation and wait for the go, as always.

Extraction, once a clip exists:

```bash
ffmpeg -i beat-explode.mp4 -vf "scale=1920:1080,fps=<n>" -q:v 4 \
  public/products/beat-frames/%05d.jpg
```

`fps` is chosen so the clip yields 192 frames — a 8s clip needs 24. Then
**renumber from zero**: ffmpeg's `%05d` starts at `00001.jpg`, the renderer
starts at `00000.jpg`. Off by one here means the first frame never draws.

---

## 5. The code change

1. `features/products/lib/data/data.ts` — swap momo-beat's `hero` block from
   `kind: "exploded"` to:
   ```ts
   hero: {
     kind: "frames",
     framePath: "/products/beat-frames/",
     frameCount: 192,
     scrollVh: 500,
     intro: { /* unchanged */ },
     beats: [ /* unchanged copy, windows retimed — see below */ ],
   }
   ```
2. **Keep the copy.** The three beats (`Every layer engineered.`, `Bass you
   feel.`, `360° of sound.`) and the intro are agreed and stay word for word.
   Only the `window` tuples get retimed, because they currently mark moments in
   the layer-slide, not in the new footage. Watch the rendered sequence and set
   each window to the scroll fraction where its moment actually lands.
3. **Decide what happens to the exploded renderer.** Once momo-beat moves,
   `kind: "exploded"` has no remaining user. Either delete the schema, the
   renderer and `public/products/beat-exploded/`, or keep them deliberately.
   Do not leave it undecided — dead branches are what the architecture ratchet
   exists to catch. Note route A above *needs* those PNGs, so delete only after
   the frames are final.

---

## 6. Tests — test-first, as always

- `qa/unit/showcase/scroll-plan.test.ts:136` finds the frames hero with
  `products.find(p => p.hero.kind === "frames")` — **singular**. With two frames
  heroes it still passes, but it silently only ever tests momo-x. Change it to
  cover every frames hero before adding the second one. That is the failing test
  this sprint starts from.
- Add a guard that `frameCount` matches the number of files actually on disk at
  `framePath`. The failure mode this prevents is real and silent: a short folder
  leaves the loader stuck behind its preload gate forever.
- The existing doc-path guard (`qa/unit/docs/doc-paths.test.ts`) checks paths
  named in docs exist — keep it green when this file names the new folder.
- Smoke and axe already cover product pages; a scrubbed canvas needs no new
  axe surface, but the loading overlay is a full-screen blocker and should keep
  its accessible text.

---

## 7. Two things to weigh before starting

- **Weight.** This adds ~16 MB to the repo and to that page. `FrameScrollHero`
  preloads *every* frame before it shows anything, so the visitor waits behind a
  progress bar. Momo X already sets that precedent, so a second one is
  consistent rather than novel — but two products at 16 MB each is a real repo
  and bandwidth cost, and the owner should accept it knowingly.
- **"This is 1 of 2."** Momo Air and Momo Studio are `parallax`. If they are the
  rest of the plan, that is 48 MB of frames across four products, and the
  loading pattern becomes the site's defining behaviour. Worth deciding the
  whole shape now rather than per product.

---

## 8. Starting prompt for the fresh terminal

> Read `docs/hand-off/momo-beat-frame-hero.md` in full. Section 4 is the asset
> work, section 5 the code change, section 6 the tests. The engine already
> exists and is generic — do not rebuild it. Branch `v0/<id>-beat-frame-hero`
> off refreshed `main`, failing test first per section 6. Price every image or
> video generation and wait for the go before spending. The copy in section 5 is
> agreed; only the beat `window` tuples change.
