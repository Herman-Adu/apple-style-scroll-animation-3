# Showcase Reset & Stripe Setup

Practical runbook for two things:

1. Resetting the backend to a clean state for a fresh demo.
2. What Stripe needs before it can process real payments for Momo.

Plus notes on the provider "scaffolding" code so you know it isn't accidental dead code.

---

## 1. Reset the backend to a clean showcase base

### What gets wiped vs. kept

**Wiped** (all user-generated / demo runtime data):

| Table          | What it holds                                 |
| -------------- | --------------------------------------------- |
| `session`      | Better Auth login sessions                    |
| `account`      | Better Auth credential/OAuth records          |
| `verification` | Better Auth email-verification / reset tokens |
| `user`         | All user accounts (customers **and** admins)  |
| `orders`       | All placed orders                             |

**Kept** (your configured store, not demo noise):

| Table                                | Why keep it                             |
| ------------------------------------ | --------------------------------------- |
| `store_settings`                     | Theme + company profile                 |
| `email_settings` / `email_templates` | Email configuration and templates       |
| `message_presets`                    | Canned admin replies                    |
| `product_overlay`                    | Admin product edits + live stock counts |

> `reviews` and `subscribers` may contain a mix of seeded and real entries. They are **not** wiped by the steps below. Clear them explicitly (see optional step) only if you want a truly empty review wall / mailing list.

### Better Auth note

This app's Better Auth store **is** the Neon `user` / `session` / `account` / `verification` tables. There is no separate Better Auth dashboard to clean out — deleting those rows is deleting the auth users. After the wipe, the first person to sign up is recreated fresh, and admin access is granted by the allowlist (see step 4).

### Step-by-step (manual)

You run these against the Neon Postgres database behind the project.

#### Option A — Neon Console (SQL Editor)

1. Go to the [Neon Console](https://console.neon.tech) and open this project (`NEON_PROJECT_ID`).
2. Open **SQL Editor** on the primary branch.
3. (Optional) Confirm what you're about to delete:

   ```sql
   SELECT
     (SELECT count(*) FROM "user")         AS users,
     (SELECT count(*) FROM "session")      AS sessions,
     (SELECT count(*) FROM "account")      AS accounts,
     (SELECT count(*) FROM "verification") AS verifications,
     (SELECT count(*) FROM "orders")       AS orders;
   ```

4. Run the wipe **as a single transaction, in this order** (children before parents, so foreign keys don't block you):

   ```sql
   BEGIN;
   DELETE FROM "session";
   DELETE FROM "account";
   DELETE FROM "verification";
   DELETE FROM "orders";
   DELETE FROM "user";
   COMMIT;
   ```

5. Verify everything is zero (and preserved tables are untouched):

   ```sql
   SELECT
     (SELECT count(*) FROM "user")           AS users,
     (SELECT count(*) FROM "session")        AS sessions,
     (SELECT count(*) FROM "account")        AS accounts,
     (SELECT count(*) FROM "verification")   AS verifications,
     (SELECT count(*) FROM "orders")         AS orders,
     (SELECT count(*) FROM "store_settings") AS store_settings,   -- expect 1
     (SELECT count(*) FROM "email_templates") AS email_templates; -- expect > 0
   ```

6. (Optional) Also clear reviews / subscribers for a fully blank slate:

   ```sql
   DELETE FROM "reviews";
   DELETE FROM "subscribers";
   ```

#### Option B — psql from your machine

```bash
# Use the pooled or unpooled connection string from Neon / your env (DATABASE_URL).
psql "$DATABASE_URL" <<'SQL'
BEGIN;
DELETE FROM "session";
DELETE FROM "account";
DELETE FROM "verification";
DELETE FROM "orders";
DELETE FROM "user";
COMMIT;
SQL
```

> Table names are lowercase and reserved-ish (`user` is a SQL keyword), so **always quote them** with double quotes exactly as shown.

### Step 4 — Get back into admin after the wipe

1. Go to the app's sign-up page and register with an **allowlisted admin email**.
   - The admin allowlist is defined in the auth config (`lib/auth`). `admin@adudev.co.uk` is already allowlisted.
   - To add another admin address, edit the allowlist in `lib/auth` and redeploy.
2. Sign in. The account is promoted to admin automatically because the email is on the allowlist.
3. Visit `/admin` — your theme and company profile are exactly as you left them because `store_settings` was preserved.

---

## 2. Stripe: embedded checkout (built) + your setup steps

### Current state

Stripe embedded Checkout is **now wired in**. The flow is:

1. **Review step** — `components/checkout/checkout-view.tsx` shows the order summary, then "Pay now" calls the `startStripeCheckout` server action.
2. **Server action** (`features/checkout/lib/actions/checkout.ts`) re-prices the cart server-side (never trusts client amounts), writes a `pending_checkouts` row, and creates a Stripe Checkout Session with `ui_mode: "embedded_page"` and an idempotency key.
3. **Embedded payment** — `components/checkout/embedded-payment.tsx` mounts Stripe's `<EmbeddedCheckout>` inline on `/checkout` using the session `client_secret`.
4. **Webhook** (`app/api/stripe/webhook/route.ts`) is the source of truth: on `checkout.session.completed` (paid) it calls `finalizeCheckout` to atomically create the `orders` row + decrement stock, then dispatches confirmation emails. On `expired` / `async_payment_failed` it releases the reservation.
5. **Return page** (`app/checkout/return/page.tsx`) shows the confirmed order (falls back to finalizing if the webhook hasn't landed yet — finalization is idempotent, so the order is created exactly once) and clears the cart.

**You do not need to change any code** — you only need to point it at your own Stripe account and add the webhook secret (below).

### Using your own Stripe account instead of the Vercel-managed sandbox

The plan for this build is: **remove the Vercel Stripe integration** and use **your own Stripe account's test keys**, so you can watch test payments in your own ("momo") dashboard. Vercel stays responsible only for Neon. This is a full prototype — **test keys throughout, no live keys.**

Steps:

1. **Remove the Vercel Stripe integration** (so its injected keys stop overriding yours):
   - **Vercel project → Settings → Integrations** (or the **Connect**/**Settings** panel in the v0 sidebar) → find **Stripe** → **Remove / Disconnect**.
   - This deletes the sandbox-managed `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` it was injecting.
2. **Add your own test keys** in **Vercel project → Settings → Environment Variables** (or the **Vars** panel), from **your** Stripe Dashboard → **Developers → API keys** with **Test mode ON**:

   | Env var                              | Value from your Stripe (test mode) | Notes                                            |
   | ------------------------------------ | ---------------------------------- | ------------------------------------------------ |
   | `STRIPE_SECRET_KEY`                  | `sk_test_...`                      | Server-only. Never exposed to the browser.       |
   | `STRIPE_PUBLISHABLE_KEY`             | `pk_test_...`                      | Server-readable copy.                            |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...`                      | Same value; exposed to the client for Stripe.js. |
   | `STRIPE_WEBHOOK_SECRET`              | `whsec_...` (see below)            | Verifies webhook authenticity.                   |

   Set them for the environments you demo from (Production and/or Preview), then redeploy.

3. **Test cards:** with test keys you can pay with `4242 4242 4242 4242`, any future expiry, any CVC/ZIP. Payments show up in **your** Stripe dashboard under Test mode.

### The webhook secret

1. **Your Stripe Dashboard (Test mode) → Developers → Webhooks → Add endpoint.**
2. Endpoint URL: `https://<your-domain>/api/stripe/webhook`.
3. Subscribe to: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.
4. Copy the endpoint's **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` and redeploy.

> Until `STRIPE_WEBHOOK_SECRET` is set, the webhook route returns 500 by design (it refuses to trust unverified events). The return page's idempotent fallback still finalizes the order, but add the secret so the webhook path — the real source of truth — works.

### Local webhook testing (optional)

To exercise the webhook before deploying, use the Stripe CLI against your test account:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET for local dev
stripe trigger checkout.session.completed
```

---

## 3. Dead code / cleanup notes

Nothing is obviously abandoned, but a few things are worth knowing:

- **Alternate storage adapters are intentional, not dead code.** `features/orders/lib/adapters/local.ts`, `lib/auth/adapters/strapi.ts`, and the `local` branch in `features/reviews/lib/adapters/provider.ts` are provider-switching scaffolding selected by `NEXT_PUBLIC_AUTH_PROVIDER` (`db` is the default and what you run in production). They're unused while you're on `db`, but they're reachable by design — leave them unless you decide to commit permanently to the Neon/`db` backend, in which case they can be removed together with the `provider` switches.
- **Stripe references in `features/docs/content/*`** are documentation examples (sample code shown in the in-app docs), not real integration code. Keep them if the docs pages are part of the showcase.
- **No dead-code tooling is installed** (`knip` / `ts-prune` / `depcheck`). If you want a rigorous, repeatable audit, add one as a dev dependency and run it in CI, e.g.:

  ```bash
  pnpm add -D knip
  pnpm knip
  ```

  That will report genuinely unreferenced files, exports, and dependencies far more reliably than a manual pass.

---

## 4. Demo data for recording (seed and cleanup)

Recording the showcase clips needs a believable admin: orders, discount codes, reviews, subscribers, campaigns and message templates. `scripts/showcase-seed.mjs` writes that into the database your `DATABASE_URL` points at, using the pure builder in `scripts/lib/showcase-demo-data.mjs`.

```bash
pnpm showcase:seed                 # dry run: prints the target host and any collisions, writes nothing
pnpm showcase:seed -- --confirm    # replaces any earlier demo rows, then writes the demo set
pnpm showcase:unseed -- --confirm  # removes only the demo rows
```

How it keeps real data safe:

- Every demo row is tagged: ids start with `demo_`, order numbers with `DEMO-`, and every address uses the reserved `demo.momo-audio.test` domain, which cannot receive mail.
- Campaigns use manual audiences of demo addresses only, and the scheduled one is dated well in the future, so nothing can email a real subscriber.
- Stripe ids on demo orders are empty, so a demo order can never be refunded for real.
- Writing needs `--confirm`. Re-running replaces the demo rows and never duplicates them. Cleanup deletes only rows matching the tags above.

Real customers and orders are not hidden by the seed. If the database holds real orders, they appear in the admin lists next to the demo rows, so clean those views up (or record from an empty database) before you film.
