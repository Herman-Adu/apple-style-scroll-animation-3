# Template handover

This repository is a **prototype template**, not a production go-live runbook. Use it as a starting point for a new product and replace demo assumptions before launch.

## Fork and rebrand checklist

1. Fork this repo into your own GitHub org/user.
2. Rename the project, app metadata and public brand strings.
3. Replace demo assets in `public/` (products, heroes, showcase, docs media).
4. Rewrite customer-facing legal/support pages (`/terms`, `/privacy`, `/returns`, `/shipping`, `/warranty`).
5. Update docs and `/docs` content to match your domain, policies and workflows.

## Environment variables to replace

Set your own values in your deployment platform and local env file.

- `DATABASE_URL` (Neon/Postgres for your project)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_SITE_URL`

If you keep optional providers (Strapi, analytics, extra auth providers), replace their keys before enabling those flows.

## Keep vs delete before production

Keep:

- Feature slice structure in `features/` and shared infra in `lib/`
- Existing test stack in `qa/` (unit, integration, smoke, SEO, axe)
- Architecture checks (`pnpm arch`) and sprint protocol in `docs/next-steps.md`

Delete or replace:

- Demo/social/showcase assets and scripts that are not part of your product launch
- Demo narrative content and screenshots used in case-study style docs
- Any placeholder copy, seeded examples, or fictional business assumptions

## Production readiness gap summary

Compared with the architecture-health baseline and existing sprint ledger, this template is now intentionally positioned as a handover artifact:

- Architecture ratchets and quality gates are in place (`tsc`, lint, tests, `pnpm arch`, build).
- Security/auth hardening sprints were shipped and documented in the ledger.
- Stripe/checkout remains suitable for template onboarding; live payment/compliance rollout is project-specific and out of scope for this template.

Use this baseline to plan your own launch sprint sequence after forking.
