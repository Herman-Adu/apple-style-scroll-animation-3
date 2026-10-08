# Showcase pipeline

How the demo videos, slides and LinkedIn carousels are made, from an empty database to clean-up. Every step is a `pnpm` script, and every output is committed under `public/showcase/`.

## The five steps

| Step | Command | What it does | Output |
| --- | --- | --- | --- |
| 1. Seed | `pnpm showcase:seed -- --dry-run` | Dry run: prints the target database host, row counts and any clashes. Writes nothing. Without `--dry-run` or `--confirm` the script refuses to run. | Console only |
| 1b. Seed for real | `pnpm showcase:seed -- --confirm` | Replaces any earlier demo rows, then writes the demo set (customers, orders, offers, waiting lists, a demo admin). Every row is tagged as demo. | Demo rows in the database |
| 2. Record clips | `pnpm showcase:video` | Records each clip with Playwright, then converts it to H.264 `.mp4` with a `.jpg` poster. `--no-record` converts existing raw clips only. | `public/showcase/video/` |
| 3. Build cuts | `pnpm showcase:cuts` | Records every clip in 4:5 and 9:16, then stitches the recruiter, buyer and engineer cuts and publishes the calendar clips. `--no-record`, `--calendar-only` and `--clip <slug>` narrow the run. | `public/showcase/video/` |
| 4. Export slides and carousels | `pnpm showcase:assets` | Runs `pnpm facts`, then renders every slide to PNG and every carousel to a PDF with one page per slide. | `public/showcase/social/` |
| 5. Clean up | `pnpm showcase:unseed -- --confirm` | Removes only the rows tagged as demo. Real data is never touched. | Demo rows gone |

Run steps 2 to 4 against a running dev server. Seeding and unseeding use the database in `.env.local` or `.env.development.local`, so always read the dry-run host before adding `--confirm`.

## How a recording scrolls

`qa/showcase/scroll-plan.ts` sets the pace; `scrollToBottom` in `qa/showcase/clip.ts` drives it.

- **One pace for a page.** Every page scrolls at about 660 pixels a second, so a long page takes longer rather than scrolling faster. Pacing by a step count used to do the opposite: 36 steps covered the homepage's 11,800px in 2.5 seconds.
- **A canvas frame sequence gets a fixed 12 seconds**, whatever the recording size. Its height is set in viewport units, so a fixed pixels-per-step would still skip frames in the portrait formats. It is scrubbed at a constant speed, because easing makes the middle steps the largest and those are the ones that skip. Only the homepage hero qualifies, and it is listed in `FRAME_SEQUENCE_SECTIONS` in `qa/showcase/shot-list.ts`.
- **A scroll-triggered reveal is not a frame sequence.** The About timeline reveals itself at the ordinary pace. Giving it a frame sequence's fixed duration makes a short section crawl while the rest of the page races.
- **Steps are driven by the clock.** A `mouse.wheel` call costs about 20ms of its own, so sleeping a fixed amount per step stretched a 12-second sequence to 16.

## Carousels

Each carousel is one swipeable PDF for LinkedIn. The slide order is defined in `features/showcase/lib/domain/packs.ts` and checked by tests.

| File | Audience | Story |
| --- | --- | --- |
| `linkedin-carousel.pdf` | Everyone | The email platform case study |
| `linkedin-recruiter-carousel.pdf` | Recruiters | Outcome, proof, judgement, worked example, close |
| `linkedin-buyer-carousel.pdf` | Buyers | Cost, self-serve admin, stock-alert demand |
| `linkedin-engineer-carousel.pdf` | Engineers | Architecture, three flow sequences, test pyramid |
| `linkedin-checkout-sequence-carousel.pdf` | Engineers and buyers | Checkout one step per swipe |
| `linkedin-security-carousel.pdf` | Security reviewers | Five layers: proxy, server action, screen, merge gates, locked blocks |
| `linkedin-how-it-was-built-carousel.pdf` | Recruiters and engineers | The sprint loop: plan, test first, one PR, green only, ratchet |
| `linkedin-site-tour-carousel.pdf` | Everyone | Storefront, checkout, products, campaigns and analytics stills |

The site-tour stills in `public/showcase/tour/` are frames taken from the buyer cut with `ffmpeg-static`. Re-take them after a visible UI change, then rerun `pnpm showcase:assets`.

## Things that will catch you out

- **Checkout needs an account.** The checkout clip signs in as the seeded demo admin first. Without step 1b it records the sign-in page.
- **Restock is demo-only in recordings.** The restock clip uses a guarded demo action, so recording never changes real stock.
- **Real people are not hidden by the seed.** The admin lists real customers, orders and messages next to the demo rows, and product pages carry real review authors. Every clip installs an identity mask (`qa/showcase/identity-mask.ts`) that swaps each real name, address and avatar photo for a stand-in on the demo domain before the page paints. If the identities cannot be read from the database the clip fails rather than recording someone real, so a recording run needs database access even for the storefront.
- **Restock notifies its waiting list, so re-seed between formats.** Recording the restock clip marks the demo waiters as notified. The second format then finds nobody waiting and skips, which breaks the buyer cut. Run `pnpm showcase:seed -- --confirm` again between the two passes.
- **No dev chrome on camera.** Clips record a dev server, which paints the Next.js dev tools indicator over the page — and turns it into a red "1 Issue" badge as soon as anything logs a warning. Every clip runs through `qa/showcase/fixtures.ts`, which hides it; a unit test fails if a spec imports `test` from Playwright directly instead.
- **The enquiry clip must never press send.** `features/contact/lib/adapters/submit.ts` sends a real email through Resend to `EMAIL_TO`; the reserved-recipient guard covers demo recipients, not that path. `qa/showcase/enquiry.spec.ts` stops on the review step, and a unit test fails if any click in it touches the submit button.
- **One export at a time.** Two `showcase:assets` runs write to the same files. Stop one before starting another.
- **PDF page count.** Each carousel must have exactly one page per slide. A blank trailing page means a slide is taller than its page.
- **Facts must exist before the render.** `.generated/facts.json` is gitignored, and a slide bound to a fact renders a dash when it is missing. `pnpm showcase:assets` runs `pnpm facts` first for exactly this reason; calling Playwright directly skips it. The five fact-bound slides are the recruiter proof strip, the engineer test pyramid and coverage bars, the before/after strip and the bar chart.
- **The exporter reuses your dev server on 3000.** `playwright.social.config.mts` boots `pnpm dev` only when nothing is listening. If a dev server is already up, make sure it is running this branch, because the export screenshots whatever it serves.
- **Re-render the whole set, not a subset.** Fonts and theme are shared, so a partial render leaves the kit in two different states. The export is deterministic: the same commit on the same machine produces byte-identical files.
- **Facts drift.** Numbers on slides come from `facts.json`. If a test says a fact is stale, rerun `pnpm facts` and re-export.

## Where the text lives

- Launch kit with every caption, clip and carousel: `/docs/social-launch-kit`
- Slide copy: `features/showcase/lib/domain/`
- Resetting the database and Stripe: `docs/showcase-reset-and-stripe.md`
