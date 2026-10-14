# Showcase pipeline

How the demo videos, slides and LinkedIn carousels are made, from an empty database to clean-up. Every step is a `pnpm` script, and every output is committed under `public/showcase/`.

## The five steps

| Step | Command | What it does | Output |
| --- | --- | --- | --- |
| 1. Seed | `pnpm showcase:seed -- --dry-run` | Dry run: prints the target database host, row counts and any clashes. Writes nothing. Without `--dry-run` or `--confirm` the script refuses to run. | Console only |
| 1b. Seed for real | `pnpm showcase:seed -- --confirm` | Replaces any earlier demo rows, then writes the demo set (customers, orders, offers, waiting lists, a demo admin). Every row is tagged as demo. | Demo rows in the database |
| 1c. Check it is fit to record | `pnpm showcase:check` | Opens every route the clips film, through the same fixture a take uses, and fails if any comes up broken or behind a sign-in. Forty seconds. Run it before every recording pass. | Console only |
| 1d. Check captions | `pnpm showcase:captions` | Renders every caption on its route at all three sizes and writes one screenshot per shot. Two minutes, no recording — run it before a recording pass, not after. | `test-results/preview/captions/` |
| 2. Record clips | `pnpm showcase:video` | Records each clip with Playwright, then converts it to H.264 `.mp4` with a `.jpg` poster. `--no-record` converts existing raw clips only. | `public/showcase/video/<clip>/` |
| 3. Build cuts | `pnpm showcase:cuts` | Records every clip in 4:5 and 9:16, then stitches the recruiter, buyer and engineer cuts and publishes the calendar clips. `--no-record`, `--calendar-only` and `--clip <slug>` narrow the run. | `public/showcase/video/<clip>/` |
| 4. Export slides and carousels | `pnpm showcase:assets` | Runs `pnpm facts`, then renders every slide to PNG and every carousel to a PDF with one page per slide, recording what each file was drawn from. | `public/showcase/social/<group>/`, `public/showcase/export-manifest.json` |
| 5. Clean up | `pnpm showcase:unseed -- --confirm` | Removes only the rows tagged as demo. Real data is never touched. | Demo rows gone |

Run steps 2 to 4 against a running dev server. Seeding and unseeding use the database in `.env.local` or `.env.development.local`, so always read the dry-run host before adding `--confirm`.

## Where a caption sits

`showCaption` measures the shot before it draws. A caption never sits on headline-sized text — a product name, a page title, a revenue figure — so it takes the top band unless there is a headline up there, and the bottom otherwise. When neither band has a headline it takes whichever covers fewer separate pieces of text, which puts it over empty space rather than over a toolbar. The top band starts below the site header, because content scrolled under a sticky header is invisible but still has a box there.

Check placement with `pnpm showcase:captions` rather than by recording.

## How a recording scrolls

`qa/showcase/scroll-plan.ts` sets the pace; `scrollToBottom` in `qa/showcase/clip.ts` drives it.

- **One pace for a page.** Every page scrolls at about 660 pixels a second, so a long page takes longer rather than scrolling faster. Pacing by a step count used to do the opposite: 36 steps covered the homepage's 11,800px in 2.5 seconds.
- **A canvas frame sequence gets a fixed 12 seconds**, whatever the recording size. Its height is set in viewport units, so a fixed pixels-per-step would still skip frames in the portrait formats. It is scrubbed at a constant speed, because easing makes the middle steps the largest and those are the ones that skip. Only the homepage hero qualifies, and it is listed in `FRAME_SEQUENCE_SECTIONS` in `qa/showcase/shot-list.ts`.
- **A scroll-triggered reveal is not a frame sequence.** The About timeline reveals itself at the ordinary pace. Giving it a frame sequence's fixed duration makes a short section crawl while the rest of the page races.
- **Steps are driven by the clock.** A `mouse.wheel` call costs about 20ms of its own, so sleeping a fixed amount per step stretched a 12-second sequence to 16.

## Where the assets live

One folder per audience or topic, holding everything for it — so picking what to post means opening a folder, not filtering filenames. `features/showcase/lib/domain/asset-paths.ts` defines the shape and `qa/unit/showcase/asset-layout.test.ts` fails if anything lands outside it. **Anything new follows the same pattern.**

```
public/showcase/
  export-manifest.json                 what each published file was rendered from
  video/
    buyer/  engineer/  recruiter/     4x5.mp4  4x5.jpg  9x16.mp4  9x16.jpg
    enquiry/  journey/  restock/  sitetour/
    storefront/                        landscape.mp4  landscape.jpg
  social/
    buyer/  engineer/  recruiter/     carousel.pdf + that audience's images
    security/  how-it-was-built/      carousel.pdf  cover.png  1..5.png
    checkout-sequence/
    site-tour/                        carousel.pdf  + stills/
    email-case-study/                 carousel.pdf  + its slides
    business-case/                    brief.pdf     + its two own slides
    shared/                           infographics that belong to no audience
    shared/squares/                   the 1080×1080 squares
```

A video folder is named for the cut or clip; the file is named for the format. A social folder is named for the audience or topic; its carousel is always `carousel.pdf`.

## Carousels

Each carousel is one swipeable PDF for LinkedIn, published as `carousel.pdf` inside its own folder. The slide order is defined in `features/showcase/lib/domain/packs.ts` and checked by tests.

| Folder | Audience | Story |
| --- | --- | --- |
| `email-case-study/` | Everyone | The email platform case study |
| `recruiter/` | Recruiters | Outcome, proof, judgement, worked example, close |
| `buyer/` | Buyers | Cost, self-serve admin, stock-alert demand |
| `engineer/` | Engineers | Architecture, three flow sequences, test pyramid |
| `checkout-sequence/` | Engineers and buyers | Checkout one step per swipe |
| `security/` | Security reviewers | Five layers: proxy, server action, screen, merge gates, locked blocks |
| `how-it-was-built/` | Recruiters and engineers | The sprint loop: plan, test first, one PR, green only, ratchet |
| `site-tour/` | Everyone | Storefront, checkout, products, campaigns and analytics stills |

A **brief** is a different thing from a carousel, and the layout says so: it publishes as `brief.pdf`, not `carousel.pdf`.

| Folder | Audience | Story |
| --- | --- | --- |
| `business-case/` | CTOs and whoever approves the spend | What it is, build vs buy, three-year cost, replatform risk, the measured proof, the stack, the offer |

The difference is not cosmetic. `qa/unit/showcase/posting-calendar.test.ts` requires every published `carousel.pdf` to hold exactly one slot in the four-week calendar - which is right for a post and wrong for a document that gets forwarded in a reply or attached to a proposal. Naming it `brief.pdf` keeps both guards honest: the brief is still checked for page count, slide order and signature overrun, and the calendar does not demand a feed slot it should never have. A brief reuses the `Pack` shape, so `packProblems` still applies.

Briefs are defined in `features/showcase/lib/domain/briefs.ts` and exported by the same harness, so `pnpm showcase:assets` builds them with everything else.

The site-tour stills in `public/showcase/social/site-tour/stills/` are frames taken from the buyer cut with `ffmpeg-static`. Re-take them after a visible UI change, then rerun `pnpm showcase:assets`.

## What each export was rendered from

`public/showcase/export-manifest.json` records, per published file, the value of every fact drawn on it at the moment it was rendered. `pnpm showcase:assets` writes it — one record per file the run actually wrote, never one more — and `qa/smoke/export-freshness.spec.ts` compares it to the facts now, naming any file whose numbers have moved.

This is the half of the facts guard that was missing. `qa/smoke/facts-freshness.spec.ts` recounts the snapshot, so a wrong number cannot stay in the repo; it says nothing about the images. A docs page resolves its numbers when it renders, so S63's work made the post text current for good. A slide bakes them in. S48 shipped five PDFs with the wrong figure drawn on them, and by S64 eight files were quoting the Oct 9 snapshot — `recruiter/proof.png` printed "Automated tests 1,617" under a column headed TODAY, beneath the headline "Measured on every run, not claimed", against a real 1,830.

The record is per file and per fact, not per snapshot. Of the 73 published exports, 65 draw no fact at all and `shared/before-after.png` draws four that have read 0/0/0/32 since S43, so a snapshot-level comparison would demand a re-export of all 73 every time one unit test was added. A guard that cries wolf ends up with an allow-list, and an allow-list is the guard agreeing with the bug.

Three things follow from that, and each is deliberate:

- **Only a render may write a record.** There is no "rebuild the manifest from today's facts" helper, because it would turn the guard green without re-rendering a file. `mergeExportManifest` takes records for files a run just wrote, keeps the records of files it did not touch — so a partial run cannot claim them — and drops any file the plan no longer publishes.
- **The guard is a browser test, not a unit test.** `scripts/facts.mjs` abandons the run if Vitest fails, and `pnpm showcase:assets` is `pnpm facts && playwright test`. A unit guard over the real files would block the only command that repairs it. `pnpm facts` only *lists* Playwright tests, so a red test here never stops the fix. The pure rules are unit-tested in `qa/unit/showcase/export-manifest.test.ts`, where they never read the real manifest and so cannot deadlock.
- **A sprint that moves a test count owes a re-export.** That is the point rather than a cost: the export is deterministic, so re-rendering the whole set only changes the files whose numbers changed.

Which facts a file draws is read off the slide by `factRefsIn`, the same shape-walk as `findHardCodedNumbers` — one reports the numbers a slide typed in, the other the numbers it asked for. Neither knows anything about slide kinds, so a new kind of slide is covered the day it is written.

## Whose brand is on a slide

**Slides are AduDev's. Recordings and screenshots are the store's.**

A carousel is AduDev showing its work, so every slide carries the AduDev wordmark, the orange accent and the AduDev signature. The store is the subject, not the brand. Momo's teal belongs on the storefront, in the clips and in any screenshot of the running app — including the email screenshots inside the email case study carousel, where the emails are genuinely Momo's.

Both slide types render one frame, `features/showcase/components/slide-shell.tsx`, which sets the palette through CSS variables. A pack carousel interleaves infographic and social slides in a single PDF, so they cannot merely look similar — a different padding or header between consecutive pages reads as a mistake. Slide bodies take their accent from `--primary`; never name a colour directly.

Two guards, because this shipped wrong once: `qa/unit/showcase/slide-palette.test.ts` fails if a slide component mentions `accent-teal` or hard-codes a hex, and `qa/smoke/showcase-brand.spec.ts` renders slides and fails on any cool-toned pixel. The smoke test normalises colours through a canvas, because Chromium reports these as `oklch(...)` and an `rgb()` regex reads straight past them.

## The site tour opens on derived structure

The site tour's first four pages are built from the app's own navigation — the storefront mega-nav (`components/layout/main-nav.ts`), the admin sidebar (`features/admin/lib/domain/nav.ts`) and the docs taxonomy — mapped in `features/showcase/lib/domain/site-structure.ts`. Nothing in them is hand-listed.

The slide they replaced was hand-kept and had drifted: it omitted About and Contact, which are top-level nav, and listed Checkout and Account, which are not. Add a nav item now and `qa/unit/showcase/site-structure.test.ts` fails until it appears on a slide.

**One tree per slide.** The old slide put three columns of routes on one page; they outgrew it and the footer was drawn over them. `qa/social/export.spec.ts` now refuses to export any slide whose content overruns its signature, and names the element and the overrun in pixels. The obvious check — `scrollHeight > clientHeight` — does not see this, because the frame is `overflow-hidden` and the body is a flex child: both heights stay equal while content sits 88px past the footer. It compares painted geometry instead.

## The posting calendar

Four weeks, four posts a week, Tuesday to Friday, across LinkedIn, Telegram, X and Facebook. Each week opens with a video and alternates video, carousel, video, carousel.

**The month is ordered for recruitment.** Week one is all hiring proof — recruiter cut, recruiter carousel, engineer cut, how it was built. LinkedIn posts every week and takes 7 of the 16 slots (X 3, Telegram 3, Facebook 3); the split is uneven on purpose, because hiring managers are on LinkedIn. Client material sits in week three, since a live client is sent the buyer cut and carousel directly rather than reached through a feed.

| File | Holds |
| --- | --- |
| `features/showcase/lib/domain/posting-schedule.ts` | The month: which asset, what copy, which doc link |
| `features/showcase/lib/domain/posting-calendar.ts` | The rules — channel rotation, dates, delivery per channel, asset labels |
| `features/docs/content/social-launch-kit-calendar.ts` | Renders both into `/docs/social-launch-kit` |

Dates are derived from one start Monday (`CALENDAR_START`), so moving the whole month means changing one line. Paths are never written here: every slot names an `AssetRef` that `asset-paths.ts` resolves, so the calendar cannot drift from where the exporter writes.

**When you add an asset, give it a slot.** `qa/unit/showcase/posting-calendar.test.ts` fails while any published cut, clip or carousel is scheduled nowhere — which is how `sitetour` and `enquiry` went from S41 to S45 without reaching a posting plan. It also fails if a slot names a file that is not on disk, books one asset twice, links to a doc that is missing or owner-gated, breaks the video-first cadence, or types a measured number into the copy.

A carousel only posts as a PDF on LinkedIn and Telegram. X and Facebook take the group's images instead, so those slots carry a support still and the kit tells you to post the folder rather than the PDF.

## Things that will catch you out

- **Checkout needs an account.** The checkout clip signs in as the seeded demo admin first. Without step 1b it records the sign-in page.
- **Restock is demo-only in recordings.** The restock clip uses a guarded demo action, so recording never changes real stock.
- **Real people are not hidden by the seed.** The admin lists real customers, orders and messages next to the demo rows, and product pages carry real review authors. Every clip installs an identity mask (`qa/showcase/identity-mask.ts`) that swaps each real name, address and avatar photo for a stand-in on the demo domain before the page paints. If the identities cannot be read from the database the clip fails rather than recording someone real, so a recording run needs database access even for the storefront.
- **Restock notifies its waiting list, so re-seed between formats.** Recording the restock clip marks the demo waiters as notified. The second format then finds nobody waiting and skips, which breaks the buyer cut. Run `pnpm showcase:seed -- --confirm` again between the two passes.
- **The store's own contact details are masked too.** The contact page carries a real address and phone number for a shop that does not exist. A clip showing a masked customer beside a live phone number is both inconsistent and an invitation to spam, so `siteContactAliases` swaps them for a company address on the demo domain and a number in Ofcom's drama range. The studio locations stay: they are part of the brand's story.
- **Every Playwright config needs its own `outputDir`.** Playwright empties it before each run and defaults it to the whole of `test-results`, where the raw recordings live — so a config without one deletes the clips another pass just recorded. A unit test fails if one is missing.
- **No dev chrome on camera.** Clips record a dev server, which paints the Next.js dev tools indicator over the page — and turns it into a red "1 Issue" badge as soon as anything logs a warning. Every clip runs through `qa/showcase/fixtures.ts`, which hides it; a unit test fails if a spec imports `test` from Playwright directly instead.
- **The enquiry clip must never press send.** `features/contact/lib/adapters/submit.ts` sends a real email through Resend to `EMAIL_TO`; the reserved-recipient guard covers demo recipients, not that path. `qa/showcase/enquiry.spec.ts` stops on the review step, and a unit test fails if any click in it touches the submit button.
- **One export at a time.** Two `showcase:assets` runs write to the same files. Stop one before starting another.
- **PDF page count.** Each carousel must have exactly one page per slide. A blank trailing page means a slide is taller than its page.
- **Facts must exist before the render.** `.generated/facts.json` is gitignored, and a slide bound to a fact renders a dash when it is missing. `pnpm showcase:assets` runs `pnpm facts` first for exactly this reason; calling Playwright directly skips it. The five fact-bound slides are the recruiter proof strip, the engineer test pyramid and coverage bars, the before/after strip and the bar chart.
- **The exporter reuses your dev server on 3000.** `playwright.social.config.mts` boots `pnpm dev` only when nothing is listening. If a dev server is already up, make sure it is running this branch, because the export screenshots whatever it serves.
- **Re-render the whole set, not a subset.** Fonts and theme are shared, so a partial render leaves the kit in two different states.
- **The render is deterministic; the files are not quite.** Of the 64 PNGs, 57 came back byte-identical across S48's export and S64's. Every PDF changes on every run — Chromium writes a creation date and a document id into it, and three of the nine changed with no change in size at all — and the two mermaid slides (`email-case-study/flow.png`, `layers.png`) differ by a few dozen bytes because the diagram is laid out afresh. So a re-export always shows nine PDFs and two PNGs in the diff. Read the binary diff by which *slides* changed, never by the file count.
- **Facts drift, and an exported file cannot notice.** Numbers on slides come from `facts.json` at render time, so none is typed by hand — but a PNG keeps whatever was true the day it was exported, while the post text beside it reads the facts live. If a test says a fact is stale, rerun `pnpm facts` and re-export.

## Where the text lives

- Launch kit with every caption, clip, carousel and the posting calendar: `/docs/social-launch-kit`
- Slide copy: `features/showcase/lib/domain/`
- Post copy and the schedule: `features/showcase/lib/domain/posting-schedule.ts`
- Resetting the database and Stripe: `docs/showcase-reset-and-stripe.md`
