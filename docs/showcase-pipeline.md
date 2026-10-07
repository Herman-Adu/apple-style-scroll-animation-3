# Showcase pipeline

How the demo videos, slides and LinkedIn carousels are made, from an empty database to clean-up. Every step is a `pnpm` script, and every output is committed under `public/showcase/`.

## The five steps

| Step | Command | What it does | Output |
| --- | --- | --- | --- |
| 1. Seed | `pnpm showcase:seed` | Dry run: prints the target database host, row counts and any clashes. Writes nothing. | Console only |
| 1b. Seed for real | `pnpm showcase:seed -- --confirm` | Replaces any earlier demo rows, then writes the demo set (customers, orders, offers, waiting lists, a demo admin). Every row is tagged as demo. | Demo rows in the database |
| 2. Record clips | `pnpm showcase:video` | Records each clip with Playwright, then converts it to H.264 `.mp4` with a `.jpg` poster. `--no-record` converts existing raw clips only. | `public/showcase/video/` |
| 3. Build cuts | `pnpm showcase:cuts` | Records every clip in 4:5 and 9:16, then stitches the recruiter, buyer and engineer cuts and publishes the calendar clips. `--no-record`, `--calendar-only` and `--clip <slug>` narrow the run. | `public/showcase/video/` |
| 4. Export slides and carousels | `pnpm showcase:assets` | Runs `pnpm facts`, then renders every slide to PNG and every carousel to a PDF with one page per slide. | `public/showcase/social/` |
| 5. Clean up | `pnpm showcase:unseed -- --confirm` | Removes only the rows tagged as demo. Real data is never touched. | Demo rows gone |

Run steps 2 to 4 against a running dev server. Seeding and unseeding use the database in `.env.local` or `.env.development.local`, so always read the dry-run host before adding `--confirm`.

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
- **One export at a time.** Two `showcase:assets` runs write to the same files. Stop one before starting another.
- **PDF page count.** Each carousel must have exactly one page per slide. A blank trailing page means a slide is taller than its page.
- **Facts drift.** Numbers on slides come from `facts.json`. If a test says a fact is stale, rerun `pnpm facts` and re-export.

## Where the text lives

- Launch kit with every caption, clip and carousel: `/docs/social-launch-kit`
- Slide copy: `features/showcase/lib/domain/`
- Resetting the database and Stripe: `docs/showcase-reset-and-stripe.md`
