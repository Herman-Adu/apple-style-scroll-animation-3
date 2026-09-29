# Showcase Reset & Stripe Setup

Practical runbook for two things:

1. Resetting the backend to a clean state for a fresh demo.
2. What Stripe needs before it can process real payments for Momo.

Plus notes on the provider "scaffolding" code so you know it isn't accidental dead code.

---

## 1. Reset the backend to a clean showcase base

### What gets wiped vs. kept

**Wiped** (all user-generated / demo runtime data):

| Table          | What it holds                                  |
| -------------- | ---------------------------------------------- |
| `session`      | Better Auth login sessions                     |
| `account`      | Better Auth credential/OAuth records           |
| `verification` | Better Auth email-verification / reset tokens  |
| `user`         | All user accounts (customers **and** admins)   |
| `orders`       | All placed orders                              |

**Kept** (your configured store, not demo noise):

| Table                                   | Why keep it                              |
| --------------------------------------- | ---------------------------------------- |
| `store_settings`                        | Theme + company profile                  |
| `email_settings` / `email_templates`    | Email configuration and templates        |
| `message_presets`                       | Canned admin replies                      |
| `product_overlay`                       | Admin product edits + live stock counts  |

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

## 2. Stripe: what's needed to process real payments

### Current state (important)

The checkout flow **does not call Stripe today**. `placeOrder` in `features/checkout/actions.ts` writes an order row straight into Neon (`orders`) and returns. The `STRIPE_*` references that exist in the codebase live in `features/docs/content/*`, which is documentation copy, not payment wiring.

**Consequence:** adding live Stripe keys alone will **not** make the store charge cards. Two things are required:

1. **Live keys** from Momo's Stripe dashboard (below).
2. **A real Stripe Checkout integration** wired into checkout + a webhook that writes the order only after `checkout.session.completed`.

### Keys to add (from Momo's Stripe dashboard)

In **Stripe Dashboard → Developers → API keys** (toggle **Test mode** off for live keys):

| Env var                              | Value from Stripe            | Notes                                             |
| ------------------------------------ | ---------------------------- | ------------------------------------------------- |
| `STRIPE_SECRET_KEY`                  | Secret key `sk_live_...`     | Server-only. Never exposed to the browser.        |
| `STRIPE_PUBLISHABLE_KEY`             | Publishable key `pk_live_...`| Server-readable copy.                             |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key `pk_live_...`| Same value; exposed to the client for Stripe.js.  |
| `STRIPE_WEBHOOK_SECRET`              | `whsec_...` (see below)      | Needed to verify webhook authenticity.            |

To add them: **Vercel project → Settings → Environment Variables** (or the **Vars** panel in the v0 settings menu). Set them for the environments you demo from (Production and/or Preview), then redeploy.

> Use **test keys** (`sk_test_` / `pk_test_`) while rehearsing so you can run Stripe's test cards (e.g. `4242 4242 4242 4242`). Swap to `sk_live_` / `pk_live_` only when you're ready to take real money.

### The webhook secret

1. **Stripe Dashboard → Developers → Webhooks → Add endpoint.**
2. Endpoint URL: `https://<your-domain>/api/stripe/webhook` (the route you'll add in the wiring step).
3. Subscribe to at least `checkout.session.completed` (and optionally `payment_intent.payment_failed`).
4. Copy the endpoint's **Signing secret** (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

### Wiring still required (not yet built)

When you're ready to actually take payments, the remaining work is:

1. **Create a Checkout Session server-side** — replace the direct DB write in `placeOrder` with a call to `stripe.checkout.sessions.create(...)`, recomputing the total from server-side prices (never trust client amounts) and passing an **idempotency key** so a retry can't double-charge.
2. **Redirect to Stripe Checkout** from `components/checkout/checkout-view.tsx`, then handle `success_url` / `cancel_url`.
3. **Add the webhook route** at `app/api/stripe/webhook/route.ts` that verifies the signature with `STRIPE_WEBHOOK_SECRET` and writes the `orders` row only on `checkout.session.completed`.

This is a focused follow-up task — ask and it can be built against the Stripe-on-Vercel integration.

---

## 3. Dead code / cleanup notes

Nothing is obviously abandoned, but a few things are worth knowing:

- **Alternate storage adapters are intentional, not dead code.** `lib/orders/adapters/local.ts`, `lib/auth/adapters/strapi.ts`, and the `local` branch in `lib/reviews/provider.ts` are provider-switching scaffolding selected by `NEXT_PUBLIC_AUTH_PROVIDER` (`db` is the default and what you run in production). They're unused while you're on `db`, but they're reachable by design — leave them unless you decide to commit permanently to the Neon/`db` backend, in which case they can be removed together with the `provider` switches.
- **Stripe references in `features/docs/content/*`** are documentation examples (sample code shown in the in-app docs), not real integration code. Keep them if the docs pages are part of the showcase.
- **No dead-code tooling is installed** (`knip` / `ts-prune` / `depcheck`). If you want a rigorous, repeatable audit, add one as a dev dependency and run it in CI, e.g.:

  ```bash
  pnpm add -D knip
  pnpm knip
  ```

  That will report genuinely unreferenced files, exports, and dependencies far more reliably than a manual pass.
