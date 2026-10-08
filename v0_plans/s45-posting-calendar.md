# S45 — the posting calendar

Branch: `v0/s45-posting-calendar` (from `main` at `9c91736`).
Spec: `v0_plans/s45-posting-calendar-kickoff.md`. Data impact: **none**.

---

## Settled with the owner

| Decision | Answer |
|---|---|
| Span | **4 weeks**, week 1 starting **Mon 2026-10-12** |
| Volume | ~4 posts a week → **16 slots** |
| Channels | **All four** — LinkedIn, X, Telegram, Facebook |
| Cadence | **Alternate, video first** within each week |
| Demo data | **Not cleared.** Leave the seed and `.generated/showcase-admin.json` alone |

## The arithmetic that makes it fit

16 slots, and exactly 16 assets worth a slot:

- **8 videos** — 3 audience cuts (buyer, recruiter, engineer), 4 standalone clips
  (journey, restock, sitetour, enquiry), and the original landscape storefront clip.
- **8 carousels** — buyer, engineer, recruiter, security, how-it-was-built,
  checkout-sequence, site-tour, email-case-study.

Video-first alternation gives each week `video, carousel, video, carousel` — 8
video slots and 8 carousel slots across the month. So every asset is scheduled
**exactly once**, nothing is double-booked and nothing is orphaned. `sitetour`
and `enquiry`, which reached no posting plan in S41, get week 3 and week 4.

The ~40 infographics and squares stay what they are: support artwork. Each slot
names an optional `support` asset for channels that want a still instead of a
PDF, so they are reachable from the calendar without being scheduled as posts.

## The channel rotation

One post per channel per week, four per channel over the month. The format
order is fixed (video, carousel, video, carousel); the **channel order rotates
by one each week**, so every channel ends on 2 videos and 2 carousels:

| | Tue — video | Wed — carousel | Thu — video | Fri — carousel |
|---|---|---|---|---|
| **W1** 13→16 Oct | LinkedIn | Telegram | X | Facebook |
| **W2** 20→23 Oct | Telegram | X | Facebook | LinkedIn |
| **W3** 27→30 Oct | X | Facebook | LinkedIn | Telegram |
| **W4** 3→6 Nov | Facebook | LinkedIn | Telegram | X |

This is a rule, not a hand-typed table, so a test can assert it rather than
restate it.

## The weeks tell one story each

| Week | Theme | Tue video | Wed carousel | Thu video | Fri carousel |
|---|---|---|---|---|---|
| 1 | The store works | buyer cut | email-case-study | journey | buyer |
| 2 | Engineering depth | engineer cut | security | restock | engineer |
| 3 | Process and hiring | recruiter cut | how-it-was-built | sitetour | recruiter |
| 4 | Breadth and the ask | storefront | checkout-sequence | enquiry | site-tour |

## What gets built

### 1. Two domain modules

The calendar in the shape the kickoff asked for — **slot → asset → copy → destination**
— split so the 300-line `largeFiles` ratchet stays put and the rules read apart
from the month:

- `posting-calendar.ts` — types, constants, every derivation.
- `posting-schedule.ts` — the sixteen slots: asset, copy, link.

```ts
export const CHANNELS = ["linkedin", "x", "telegram", "facebook"] as const
export const CALENDAR_START = "2026-10-12"   // Monday of week 1
export const CALENDAR_WEEKS = 4

export type AssetRef =
  | { kind: "video"; group: string; format: "4x5" | "9x16" | "landscape" }
  | { kind: "carousel"; group: AssetGroup }
  | { kind: "social"; id: string }

export type PostingSlot = {
  week: number
  day: "tue" | "wed" | "thu" | "fri"
  channel: Channel
  asset: AssetRef            // the hero: a video or a carousel
  support?: AssetRef         // a still for channels that cannot take a PDF
  hook: string               // the copy, number-free
  docSlug: string            // links to a PUBLIC doc, never an owner-gated one
}
```

Derived, not typed twice:

- `slotDate(slot)` → ISO date from `CALENDAR_START` + week + day. One constant
  moves the whole month.
- `assetRefPath(ref)` → public URL via the **existing** `asset-paths.ts`
  (`videoPath`, `carouselPdfPath`, `socialAssetPath`). The calendar must not
  spell a path itself; that is what S43 centralised.
- `slotFormat(slot)` → `"video" | "carousel"` from the asset kind.
- `deliveryFor(channel, format)` → how that channel takes it (LinkedIn document
  post, Telegram album, X opener plus replies, Facebook multi-image). This is the
  "destination" half, and it is per-channel behaviour rather than 16 repetitions.
- `takesPdf(channel)` → LinkedIn and Telegram only. X and Facebook cannot post a
  PDF, so their carousel slots carry a support still and the kit points them at
  the group's folder instead of `carousel.pdf`. A test fails if one of those
  slots has no still.
- `docLink(slot)` → `[live URL]/docs/<slug>`, matching the kit's placeholder.

### 2. `qa/unit/showcase/posting-calendar.test.ts` — written first

Each of these is a real failure mode, not a restatement:

1. **16 slots**, 4 weeks × 4, and the dates land on the right weekdays starting
   2026-10-12.
2. **Every scheduled asset exists on disk** — resolve `assetRefPath` to
   `public/` and `existsSync`, the pattern from `asset-layout.test.ts`.
3. **No asset is double-booked** — no `AssetRef` appears in two slots.
4. **Nothing worth posting is orphaned** — the 8 videos and 8 carousels the
   repo publishes are each scheduled exactly once. Derived from `CUTS`,
   `CALENDAR_CLIPS` and `ASSET_GROUPS`, so adding an asset in a later sprint
   fails this test until it reaches the calendar. **This is the test that would
   have caught the S41 gap.**
5. **Every link resolves to a public doc** — the slug exists in `docs` *and* its
   `access` is `"public"`. Linking followers to an owner-gated page would 404
   for them.
6. **The cadence rule holds** — each week is video, carousel, video, carousel.
7. **The channel rotation holds** — one post per channel per week; four per
   channel; two videos and two carousels each.
8. **The copy quotes no typed numbers** — reuse `findHardCodedNumbers` from
   `domain/facts.ts` over the hooks, the same guard the slides already pass.
9. **Every asset reads as words, never a folder name**, since the kit prints the
   label; and **a carousel on X or Facebook has a support still**.

### 3. Render it into the launch kit

Replace the three-week "Posting order" `steps` block in
`features/docs/content/social-launch-kit.ts` with blocks generated from the
modules, in a new `social-launch-kit-calendar.ts` alongside the existing
`-clips` / `-cuts` / `-carousels` modules: a month-at-a-glance table, then one
step per slot carrying the copy, the file to upload, the delivery note and the
link. It imports through `@/features/showcase`, not a deep path, because
`deepImports` is ratcheted at zero.

The existing per-channel download table and the four post bodies stay; the
calendar says *when* and *what*, they say *how to word it*.

### 4. Docs

- `docs/showcase-pipeline.md` — a short section on where the calendar lives and
  what to do when an asset is added.
- `docs/next-steps.md` — the S45 row rides in its own PR after merge, per convention.

## Order of work

1. Write the test file; watch all eight fail for the right reasons.
2. Build `posting-calendar.ts` until green.
3. Wire the launch-kit block module; bump `updatedAt`.
4. `tsc`, lint, arch, unit, integration, smoke, axe, seo.
5. PR, green CI, squash-merge, ledger row.

## Out of scope

No recording, no re-export, no seeding or unseeding. No new assets — the sprint
schedules what S41-S44 already published. `pnpm showcase:check` and the
recording scripts are not touched, so none of the 15-minute passes are needed.
