# S45 kickoff — the posting calendar

Start a fresh session with this. Everything below is current as of S44; nothing
needs re-deriving.

Repo: `C:/Users/herma/source/repository/apple-style-scroll-animation-3`
Windows + PowerShell + pnpm, dev server on **port 3000** (`pnpm dev`).
Read `AGENTS.md` first, then `.agents/skills/sprint-workflow/`.

---

## Where things stand

`main` is at `0d58c46` (S43 closed). Everything below it is merged and green.

**One PR is open and unmerged: #183 — "S44: refresh the measured numbers and
re-export the slides".** CI is green. It has not been reviewed.

Do this first:

1. Review #183 if you want, then `gh pr merge 183 --squash --delete-branch`.
2. Refresh `main`, confirm it points at the merge commit.
3. Add the S44 ledger row to `docs/next-steps.md` with the real PR number and
   merge SHA, and open it as its own small PR (the repo's convention — see #178,
   #180, #182).

**The owner still has to clear the demo data** when they are ready:
`pnpm showcase:unseed -- --confirm`. It also removes the git-ignored
`.generated/showcase-admin.json` holding the demo admin password. Ask before
assuming it is done; the showcase clips and the admin screenshots were recorded
against that seed.

---

## The sprint: a posting calendar

### The gap

The launch kit has a **"Posting order"** of three weeks
(`features/docs/content/social-launch-kit.ts`, near the end): LinkedIn posts 1-3,
one Facebook post, a Telegram drop and an X thread. Against that there are now:

- 3 audience cuts — recruiter (0:56), buyer (2:03), engineer (0:34)
- 4 standalone clips — journey (0:46), restock (0:21), sitetour (0:56), enquiry (0:26)
- 8 carousels — buyer, engineer, recruiter, security, how-it-was-built,
  checkout-sequence, site-tour, email-case-study
- ~40 infographics and squares

So most of the kit is scheduled nowhere, and **`sitetour` and `enquiry` appear in
no posting plan at all** — they were added in S41 and never reached the calendar.

### What to build

A calendar that binds **slot → asset → copy → destination**, as data in a domain
module so it can be tested, rendered into the launch kit doc, and kept honest:

- every scheduled asset exists on disk (reuse the pattern in
  `qa/unit/showcase/asset-layout.test.ts`)
- no asset is double-booked, and nothing worth posting is orphaned
- every link resolves

### Ask the owner first

These change the shape of the work, so settle them before planning:

1. **How many weeks**, and starting when?
2. **Which channels** — LinkedIn only, or Facebook / Telegram / X as well? That
   decides one schedule or one per channel.
3. **Cadence** — posts per week, and whether video and carousel alternate.

---

## Where things live

```
public/showcase/
  video/<cut-or-clip>/<format>.mp4        buyer/9x16.mp4, restock/4x5.mp4,
                                          storefront/landscape.mp4
  social/<audience-or-topic>/carousel.pdf + that group's images
                                          buyer/, engineer/, recruiter/,
                                          security/, how-it-was-built/,
                                          checkout-sequence/, site-tour/,
                                          email-case-study/, shared/
```

`features/showcase/lib/domain/asset-paths.ts` is the only place this shape is
written down. The social exporter derives its output paths from it, so the
exporter writes where the docs link. `scripts/lib/showcase-paths.mjs` does the
same for recordings. **Anything new follows this pattern** —
`qa/unit/showcase/asset-layout.test.ts` fails if it does not.

Plans: `v0_plans/*.md`. Ledger: `docs/next-steps.md`. Runbook:
`docs/showcase-pipeline.md`.

---

## Commands

```bash
pnpm showcase:check                 # 40s — every route a clip films, before recording
pnpm showcase:captions              # ~7min — every caption on its route, all 3 sizes
pnpm showcase:seed -- --dry-run     # prints the target host, writes nothing
pnpm showcase:seed -- --confirm     # demo rows; needed for every admin clip
pnpm showcase:video                 # record + convert
pnpm showcase:cuts                  # record both social formats, stitch the cuts
pnpm facts && pnpm showcase:assets  # refresh measured numbers, re-export slides
pnpm showcase:unseed -- --confirm   # remove demo rows

pnpm exec tsc --noEmit && pnpm lint && pnpm arch
pnpm test:unit && pnpm test:integration
pnpm test:smoke && pnpm test:axe && pnpm test:seo
```

---

## Things that cost time in S41-S44 — do not relearn them

- **Check before you spend.** A recording pass is ~15 minutes; `showcase:check`
  is 40 seconds and reproduces the same failures. Three faults reached published
  clips because this was run after recording instead of before.
- **A long-lived `pnpm dev` degrades** after a recording pass or a 67-slide
  export, then answers 500 to the parallel smoke suite while `curl` still gets
  200. Restart it; do not hunt the code.
- **An intermittent axe failure is usually real.** Print the offending selectors
  (the spec does this now) rather than rerunning until it passes.
- **Restock notifies its waiting list**, so re-seed between the two format passes
  or the second one skips and the buyer cut cannot build.
- **The enquiry clip must never press send** — it would email the owner for real
  through Resend. A unit test fails if any click in that spec touches the button.
- Every Playwright config needs its own `outputDir`, or it deletes the raw
  recordings another pass just made. A unit test guards this.

More detail: `.agents/skills/sprint-workflow/references/troubleshooting.md`.
