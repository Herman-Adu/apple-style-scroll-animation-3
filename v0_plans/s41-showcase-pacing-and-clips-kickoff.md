# S41 kickoff prompt (new chat)

Use this to start a fresh session and run **S41**. Everything measured in the
previous session is written down here, so nothing needs re-deriving.

---

Start from current repo state and run **S41** as a new sprint.

Repo:

- `C:/Users/herma/source/repository/apple-style-scroll-animation-3`
- Windows + PowerShell + pnpm, dev server on **port 3000** (`pnpm dev`)
- Branch: `v0/s41-showcase-pacing-and-clips` (already created, holds this plan)
- Read `AGENTS.md` first, then `.agents/skills/sprint-workflow/`

**Before starting:** confirm PR #175 (S40) is merged and rebase this branch on
`main` if it is. S41 touches `qa/showcase/*`, S40 touched facts and docs, so
they do not conflict — but start from the merged state.

## Goal

Two problems with the demo videos, both confirmed by measurement:

1. The homepage scroll animation is recorded far too fast to see.
2. The About, Contact and Articles pages appear in no clip at all.

## What was measured (do not re-measure)

Measured live at viewport 1280×1600 on 2026-10-08:

| Thing | Value |
|---|---|
| Homepage total height | 11,800px (7.4 screens) |
| `#top` — the scroll-animation hero | **8,000px**, 68% of the page |
| `#statement` | 610px |
| `#collection` | 1,852px |
| `#journal` | 881px |
| Canvas frames in the sequence | **192** (`public/frames/00000.jpg` … `00191.jpg`, `frameCount: 192` in `features/products/lib/data/data.ts`) |
| So one frame every | **41.7px of scroll** |
| `/about` | 4,448px, 5 sections, `AboutTimeline` |
| `/contact` | 3,094px, map in an iframe, 5 enquiry types |
| `/articles` | 3,300px |

Recording viewports (`scripts/lib/showcase-formats.mjs`): landscape 1280×720,
4x5 768×960, 9x16 540×960. The viewport is shorter than the one measured above,
so the scrollable distance in a real recording is *larger*, not smaller.

### Why the hero looks like a smear

`qa/showcase/clip.ts` → `scrollToBottom(page, steps = 36)` steps the whole page
in 36 wheel events with a 70ms wait each: **~2.5 seconds for 10,200px**.

- ~283px per step ÷ 41.7px per frame = **~7 frames skipped every step**
- Only about **28 of the 192 frames ever render** (~15%)
- `frame-scroll-hero.tsx` wraps progress in
  `useSpring({ stiffness: 100, damping: 30 })`, which needs roughly half a
  second to settle. At 283px every 70ms it never catches up, so the canvas lags
  and then snaps.

`journey.spec.ts` is worse: `smoothScroll(page, 2400, 40)` is a hard-coded
**2,400px of 10,200px (24%)**. It never leaves the hero, so `#collection` and
`#journal` are never on camera.

## Decisions already made by the owner

- **Hero pacing: 12 seconds**, showing all 192 frames.
- **One** new combined clip for the site tour (About → Articles → Contact).
- **A separate** clip for the contact form functionality.

## The work

### 1. Pace by distance, not by step count

The root cause is that pacing is set by a fixed step count, so the longer the
page the faster it scrolls — backwards. Replace with pixels-per-step:

- Scroll-animated sections: **~40px per step** (≈ one frame per step).
  The hero's 8,000px becomes ~200 steps; at ~60ms per step that is **~12s**.
- Static sections: ~200px per step, so the remaining ~3,800px takes about a
  second.

Keep the existing eased `planScroll` shape (`qa/showcase/scroll-plan.ts`) —
it already guarantees the deltas sum to the full distance and that the footer
is reached. The change is to choose the step *count* from the distance and the
target pace, rather than hard-coding 36.

Give `journey.spec.ts` the same treatment instead of its 2,400px.

### 2. New clip: site tour (one clip)

About → Articles → Contact, with the About timeline given time to animate and
the Contact map visible on arrival. Captions in the same style as the existing
clips (`qa/showcase/shot-list.ts`).

### 3. New clip: contact form functionality

The 5 enquiry types live in `features/contact/lib/domain/contact-info.ts`:
`general`, `support`, `review`, `wholesale`, `press` (each `access: "public"`
or `"account"`, each with its own fields). The form is multi-step
(`components/contact/contact-form.tsx`, `useState(0)` step).

Show the picker, then **two** types — suggest `general` and `wholesale` — so
the fields visibly change. Showing all five is tedious.

> **⚠️ Do not submit the form on camera without a guard.**
> `features/contact/lib/adapters/submit.ts` sends a real email through Resend
> to `EMAIL_TO` with reply-to set to the sender. The `reserved-recipients`
> guard covers demo *recipients*, not this path. Multiple takes × 2 formats
> would fill the owner's inbox and burn Resend quota.
>
> Pick one, and say which in the PR:
> - stop at the review step and never click send (simplest, still demonstrates
>   the functionality), or
> - add an explicit, tested recording guard that short-circuits delivery.

### 4. Wire the new clips in

`qa/showcase/shot-list.ts` (CLIPS + captions), `scripts/lib/showcase-cuts.mjs`
(whether they join a cut — the site tour and form clip suit the **buyer**
audience), and `features/docs/content/social-launch-kit-cuts.ts` if they are
published. `qa/unit/showcase/shot-list.test.ts` and `cuts.test.ts` pin this.

## Non-negotiables

From `AGENTS.md`: never commit to `main`; test first (write the failing test,
see it fail for the right reason); `tsc`, lint, arch, unit, integration, smoke
and axe all green before merge; one sprint = one branch = one PR = squash-merge.

## Commands

```bash
pnpm dev                        # port 3000
pnpm showcase:seed -- --confirm # demo data (dry run first, without --confirm)
pnpm showcase:video             # record all clips + transcode
pnpm showcase:cuts              # record 4:5 and 9:16, stitch the audience cuts
pnpm showcase:unseed -- --confirm

# re-record ONE clip while iterating, instead of all eight
pnpm exec playwright test --config qa/config/playwright.showcase.config.mts -g "storefront"
```

Everything is local: Playwright plus `ffmpeg-static`. No API cost. The only
external writes are the demo seed to Neon and, if the form is submitted, Resend.

## Definition of done

- The hero reads at ~12s with the frame sequence visibly animating, not smearing.
- `journey` reaches `#collection` and `#journal`.
- Site tour and contact form clips exist in both 4:5 and 9:16, with posters.
- No real email sent by a recording, or a tested guard explains why it is safe.
- All gates green; ledger row added to `docs/next-steps.md`; PR opened.
