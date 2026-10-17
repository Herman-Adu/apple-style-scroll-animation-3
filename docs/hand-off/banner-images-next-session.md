# Next session starts here — banner images, then S68

## Task

Generate two banner images with the `generate-anything` skill over the kie MCP
(now connected, 5 tools). Then S68.

Read `docs/hand-off/profile-copy-s68.md` first. **Section 4 is the banner brief.
Section 6 is the S68 scope.** Nothing in that doc is a draft.

## Session rules

- Price every generation and wait for the go before spending. One at a time.
- No test suites, no builds, no repo-wide searches, no subagents.

## Wording — agreed, do not redraft

**Banner 1 — LinkedIn personal, 1584x396:**
- `HERMAN ADU`
- Senior Full-Stack Engineer
- Next.js 16 · React 19 · TypeScript · Prisma

**Banner 2 — Adu Dev company page + Facebook:**
- `BUILT PROPERLY. KEPT RUNNING.`
- Commercial websites and the systems behind them

**Rejected, never reuse:** "EDU + AI DEV" and "ENTERPRISE AI SYSTEMS. BUILT TO
SCALE." Section 4 of the handoff doc says why.

## Layout

Keep from the approved "green arrow" layout: dark circuit-board treatment,
headshot placement, Next.js / Strapi / TypeScript / AI tiles, white-and-orange
type. Replace the wording entirely.

## Method — this is the whole point

**Image-to-image editing, not text-to-image.** The earlier batch was
text-to-image and it re-drew Herman's face on every version except the
green-arrow one. The real headshot goes in as a reference to preserve likeness.

Herman drops in two files: the clean headshot and the approved layout reference.
Both go in as refs. The prompt must say explicitly: use the headshot's face
exactly, do not redraw it.

## Decisions already made (carry these over, don't re-derive)

- **Model: Nano Banana Pro, image-to-image.** Chosen over the skill's
  `gpt-image-2-image-to-image` default specifically because GPT-Image-2 restyles
  faces, which is the failure mode we are fixing. Nano Banana Pro retains
  identity and takes up to 8 reference images.
- **Price: 18 credits ~= $0.09 per image at 2K** (24 credits ~= $0.12 at 4K).
  Verified from the live kie.ai page on 2026-10-16. GPT-Image-2 would be
  10 credits ~= $0.05 at 2K, but it is the model that redrew the face.
- **Aspect ratio constraint.** 1584x396 is 4:1. Nano Banana Pro's widest ratio
  is 21:9 (2.33:1); no listed model does 4:1 natively. So: generate 21:9 at 2K
  (~2328x998), compose so the headshot and all type sit inside the central 4:1
  band, then crop to exactly 1584x396 locally. The prompt must reserve that band
  deliberately or the crop eats the type.

## After the images are settled

S68 — the profile copy into `features/docs/content/social-launch-pack-recruiter.ts`
and `-client.ts`, test-first, on branch `v0/s68-profile-copy`. Scope is section 6.
`219` and `2,002` are template values read from `facts.repo.mergedPrs` and
`facts.tests.total`, never typed in, and scoped to Momo Audio only.
