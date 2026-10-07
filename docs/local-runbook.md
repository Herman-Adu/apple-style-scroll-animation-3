# Local run log book

Quick reference for running the app on this machine with Stripe webhooks.
**Never paste secret values into chat, issues or commits** — refer to keys by name only.

## Daily start (two terminals)

```powershell
# Terminal 1 — app (port 3000)
pnpm dev

# Terminal 2 — Stripe webhook forwarder
pnpm stripe:listen
```

App: http://localhost:3000

## Port rule — 3000, everywhere

The app runs on **3000** and nothing else: the dev server, the Stripe forwarder,
the Playwright configs, CI and the env files all read the same number. There is
no second dev script to pick between, and `qa/unit/meta/dev-port.test.ts` fails
if another port reappears in any of them.

1. App: `pnpm dev` (`next dev`, which defaults to 3000)
2. Forwarder: `stripe:listen` forwards to `localhost:3000/api/stripe/webhook`
3. Env: `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000`

Env is only read at startup, so restart the dev server after changing it. If
3000 is genuinely occupied, set `PORT` for the one command that needs it rather
than pinning a different port in the repo.

## Env files

| File                     | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `.env`                   | Original local keys (e.g. `RESEND_API_KEY`)                                         |
| `.env.local`             | Pulled from Vercel (`vercel env pull`) — **overwritten on every pull**              |
| `.env.development.local` | Local-only overrides; loaded after `.env.local`, never touched by `vercel env pull` |

All `.env*` files are git-ignored.

Put local overrides in `.env.development.local` (key names only shown here):

```
BETTER_AUTH_URL
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET      # the whsec_... printed by `stripe listen`
STRIPE_PUBLIC_ORIGIN       # optional public origin (e.g. ngrok) for Stripe-hosted product images
```

### Refresh variables from Vercel

```powershell
vercel env pull .env.local --environment=development
```

Then re-check the overrides above are still in `.env.development.local`, and restart the dev server.

## Stripe CLI

- Installed via `winget install --id Stripe.StripeCli`. Open a new terminal if `stripe` is not recognised.
- `stripe login` — only when the CLI reports an auth error (credentials last ~90 days). Confirm the pairing code matches in the browser.
- `pnpm stripe:listen` prints a `whsec_...` signing secret. It normally stays the same per login. Update `STRIPE_WEBHOOK_SECRET` and restart the app **only if** forwarded events return `[400]`.
- The CLI requires `--events` (or `--all-snapshot`); the script already lists the five events the handler uses.

## Testing checkout

- Success card: `4242 4242 4242 4242`, any future expiry, any CVC.
- Declined card: `4000 0000 0000 0002`.
- In the `stripe:listen` terminal, `checkout.session.completed` should show `[200]`.
- `[400]` = signing secret mismatch. `[500]` = handler error; check the dev terminal for `[v0] stripe webhook handler error`.

## Troubleshooting

| Symptom                          | Fix                                                             |
| -------------------------------- | --------------------------------------------------------------- |
| `Port 3000 is in use`            | Stop whatever holds it, or run one command with `PORT=3001`     |
| Signed in but appears signed out | Auth URL / port mismatch — check the port rule; try Chrome/Edge |
| `stripe` not recognised          | Open a new terminal (PATH refresh)                              |
| Webhook `[400]`                  | Update `STRIPE_WEBHOOK_SECRET`, restart dev server              |
| Webhook not firing               | Is `pnpm stripe:listen` running? Right port?                    |
| Prisma client errors after pull  | `pnpm install` (runs `prisma generate`)                         |

## Data warning

Development env vars currently point at the **same Neon database as Production**. Local sign-ups, orders and stock changes are real writes. Use obvious test data, or create a Neon branch and override `POSTGRES_PRISMA_URL` / `DATABASE_URL_UNPOOLED` in `.env.development.local`.

## Log

| Date       | Note                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-01 | Pulled latest `main`, linked Vercel project, pulled dev env, installed Stripe CLI, verified end-to-end test checkout on port 3001. |
