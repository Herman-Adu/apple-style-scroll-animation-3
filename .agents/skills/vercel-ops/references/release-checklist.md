# Production release checklist

Target: `momo-audio.adudev.co.uk`. Each step is reported as passed / failed / blocked.

## Before (no gate)

1. `main` is green in CI and the ledger is up to date.
2. `pnpm build` passes locally from a clean `origin/main` checkout.
3. `vercel env ls production` lists every variable the app reads. Compare it with `.env.example` or `rg -o "process\.env\.[A-Z_]+" -h | sort -u`.
4. Stripe: test or live keys are decided. If they're test keys, the UI and the posts say "demo build".
5. The latest preview deployment of `main` passes `QA_BASE_URL=<preview> pnpm test:smoke && pnpm test:axe`.

## Gate

6. Ask the user to approve `vercel --prod` (or promoting the preview) with the exact target. Wait.

## After

7. Deploy, and record the deployment URL.
8. `QA_BASE_URL=https://momo-audio.adudev.co.uk pnpm test:smoke && pnpm test:seo && pnpm test:axe`.
9. Check the Stripe webhook endpoint points at production and a test event returns 200 (`vercel logs`).
10. Replace the `[live URL]` placeholders in docs and showcase content, in a follow-up PR.
11. Rollback plan: `vercel rollback` (gated) if smoke fails in production.
