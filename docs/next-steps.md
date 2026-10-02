# Next steps

Ideas queued after the docs programme (D1–D5, PRs #84–#89). Ordered by impact.

## 1. Owner-managed lock permissions (admin UI)

**Today:** locking email blocks is limited to the owner plus emails listed in the
server-only `EMAIL_BLOCK_LOCKERS` variable (`lib/auth/permissions.ts`). That variable
is not set, so in practice only the owner can lock. Granting another admin means
editing an environment variable and redeploying.

**Proposal:** move the locker list into the database and add an
**Admin → Settings → Permissions** screen where the owner can grant or revoke lock
rights per admin.

- The owner stays permanently allowed and can't be removed.
- Every grant and revoke is written to an audit log (who, when, what).
- `canLockBlocks()` reads from the database, and the env var stays as a seed and fallback.
- The proxy, server actions and UI keep the same three-layer check from #83.

## 2. Demo video, recorded from the sandbox

Playwright, already installed, can record a browser session to `.webm` with
`recordVideo`, with no screen recorder needed.

- **Clip A (storefront, 20–30s):** Apple-style scroll, product page, add to cart, checkout.
- **Clip B (admin, 20–30s):** seasonal starter, edit a block, lock it, preview.
- `ffmpeg` is not installed in the sandbox. Add `ffmpeg-static` as a dev dependency to
  convert to `.mp4` (H.264), which LinkedIn, Facebook and Telegram all accept.
- Output goes to `public/showcase/video/` so it can be downloaded and embedded in the case study.

## 3. Go live properly

- Deploy current `main` to production (`momo-audio.adudev.co.uk`). The production build
  has lagged behind merges before.
- Stripe still uses test keys (`pk_test`). Until it runs on live keys, social posts
  should say it's a demo build.

## 4. Social launch assets

- A LinkedIn carousel exported as a PDF (the swipeable document format) built from the
  existing showcase screenshots and the public case study.
- The same set resized to 1080x1080 for Facebook and Telegram.
