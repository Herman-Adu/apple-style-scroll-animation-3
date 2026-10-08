# S45 — the posting calendar

Branch: `v0/s45-posting-calendar` (from `main` at `9c91736`). PR #185.
Spec: `v0_plans/s45-posting-calendar-kickoff.md`. Data impact: **none**.

---

## Settled with the owner

| Decision | Answer |
|---|---|
| Span | **4 weeks**, week 1 starting **Mon 2026-10-12** |
| Volume | ~4 posts a week → **16 slots** total (not 16 per channel) |
| Channels | **All four** — LinkedIn, Telegram, X, Facebook |
| Cadence | **Alternate, video first** within each week |
| Demo data | **Not cleared.** Leave the seed and `.generated/showcase-admin.json` alone |

**Why four weeks:** recruitment, and the owner wants recruitment value as soon as
possible. That reordered the month — see below. The owner also has two live
client conversations, which are handled **off-calendar**: a known prospect is
sent the buyer cut and carousel directly, and no feed post improves on that.

## The arithmetic that makes it fit

16 slots, and exactly 16 assets worth a slot:

- **8 videos** — 3 audience cuts (recruiter, engineer, buyer), 4 standalone clips
  (journey, sitetour, restock, enquiry), and the landscape storefront clip.
- **8 carousels** — recruiter, how-it-was-built, engineer, security, buyer,
  email-case-study, checkout-sequence, site-tour.

Video-first alternation gives each week `video, carousel, video, carousel` — 8
video slots and 8 carousel slots. So every asset is scheduled **exactly once**,
nothing is double-booked and nothing is orphaned. `sitetour` and `enquiry`, which
reached no posting plan in S41, get week 2 and week 4.

The ~40 infographics and squares stay support artwork. Slots that need a still
name one as `support`.

## Ordered for recruitment

The first draft spread the assets thematically and put the hiring material in
week 3. That was wrong for the stated goal, so:

- **Week one is nothing but hiring proof.** `RECRUITMENT_ASSETS` names the four,
  and a test fails if any of them lands outside week 1.
- **LinkedIn is weighted, not rotated** — 7 of 16 slots, and at least one post
  every week, because that is where hiring managers are. X 3, Telegram 3,
  Facebook 3. An even split would read as fairer and work worse.
- **Client material sits in week 3**, since the live prospects are handled directly.

| Week | Theme | Tue video | Wed carousel | Thu video | Fri carousel |
|---|---|---|---|---|---|
| 1 | Recruitment proof | LI recruiter cut | LI recruiter | X engineer cut | TG how-it-was-built |
| 2 | Engineering depth | LI journey | LI engineer | X sitetour | X security |
| 3 | The store works | LI buyer cut | FB buyer | FB restock | LI email-case-study |
| 4 | Breadth, and the ask | FB storefront | LI checkout-sequence | TG enquiry | TG site-tour |

## What gets built

### 1. Two domain modules

The calendar in the shape the kickoff asked for — **slot → asset → copy →
destination** — split so the 300-line `largeFiles` ratchet stays put:

- `posting-calendar.ts` — types, constants and every derivation.
- `posting-schedule.ts` — the sixteen slots: channel, asset, copy, link.

```ts
export const CHANNELS = ["linkedin", "telegram", "x", "facebook"] as const
export const CALENDAR_START = "2026-10-12"   // Monday of week 1
export const CHANNEL_POSTS = { linkedin: 7, x: 3, telegram: 3, facebook: 3 }
export const RECRUITMENT_ASSETS = [
  "video:recruiter", "carousel:recruiter", "video:engineer", "carousel:how-it-was-built",
]

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
  docSlug: string            // a PUBLIC doc, never an owner-gated one
}
```

Derived, not typed twice:

- `slotDate(slot)` / `slotWhen(slot)` → ISO date and "Tue 13 Oct", both from
  `CALENDAR_START`. One constant moves the whole month.
- `assetRefPath(ref)` → public URL via the **existing** `asset-paths.ts`. The
  calendar never spells a path; that is what S43 centralised.
- `assetRefKey(ref)` → identity, for spotting a double booking.
- `slotFormat(slot)`, `assetRefLabel(ref)`, `WEEK_THEMES`.
- `deliveryFor(channel, format)` → how that channel takes it.
- `takesPdf(channel)` → LinkedIn and Telegram only. X and Facebook cannot post a
  PDF, so their carousel slots carry a support still and the kit points them at
  the group's folder instead of `carousel.pdf`.

### 2. `qa/unit/showcase/posting-calendar.test.ts` — written first

Nineteen tests. Each was confirmed to fail by breaking the invariant:

1. 16 slots, 4 weeks × 4, days in order.
2. Dates derived from one start Monday, all on weekdays.
3. Every scheduled asset exists on disk.
4. No asset is double-booked.
5. **No published video is orphaned** — derived from disk.
6. **No published carousel is orphaned** — derived from disk. These two are what
   would have caught the S41 gap.
7. Every link resolves to a doc that exists **and is public**.
8. The cadence holds, keyed off the day rather than array order.
9. The channel weights match `CHANNEL_POSTS` and account for every slot.
10. LinkedIn posts every week.
11. **Every recruitment asset is in week one**, and week one is only those.
12. Delivery is defined for every channel and format.
13. A carousel on X or Facebook has a support still.
14. No measured number is typed into the copy (`findHardCodedNumbers`).
15. Every asset reads as words, never a folder name.
16. Every week has a theme.

### 3. Render it into the launch kit

`features/docs/content/social-launch-kit-calendar.ts` replaces the three-week
"Posting order" block: a month-at-a-glance table, then one step per slot with the
copy, the file to upload, the delivery note and the link. It imports through
`@/features/showcase`, not a deep path, because `deepImports` is ratcheted at zero.

### 4. Docs

- `docs/showcase-pipeline.md` — where the calendar lives, the recruitment
  ordering, and what to do when an asset is added.
- `docs/next-steps.md` — the S45 row rides in its own PR after merge.

## Out of scope

No recording, no re-export, no seeding or unseeding. No new assets — the sprint
schedules what S41-S44 already published.

`lib/facts/snapshot.json` still reads 1,423 unit tests against 1,449 now.
Refreshing it re-exports all 67 slides, which is its own sprint (that was S44).
