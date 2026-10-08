Showcase preview and run instructions

1. Run locally:

```bash
pnpm install
pnpm dev
```

2. Preview page: http://localhost:3000/showcase/preview

3. CI preview: push branch and check Vercel/GitHub preview URL shown in PR.

Recording the demo clips

The clip list, routes, captions and the checkout discount code live in `qa/showcase/shot-list.ts`. Every caption is checked by `qa/unit/showcase/shot-list.test.ts` before anything can be recorded.

1. Seed the demo data (a dry run unless you pass `--confirm`): see `scripts/showcase-seed.mjs`. Remove it afterwards with the matching cleanup script.
2. Record on a machine where Playwright's Chromium can launch: `pnpm showcase:video`.
3. Watch every clip end to end on the private preview page before posting anything.

Infographics

Seven images (stack, architecture layers, before and after, site map, checkout flow, quality gates, client offer) are defined in `features/showcase/lib/domain/infographics.ts` and rendered at `/showcase-render/infographic-<name>`. Stack versions, routes and the before and after numbers are read from the repo and pinned by `qa/unit/showcase/infographics.test.ts`, so they cannot drift or be invented.

- Export all PNGs with the social export spec, or capture a route at 1080x1350 (carousel) or 1080x1080 (square).
- Output lands in `public/showcase/social/<group>/` — one folder per audience or topic — and is linked from the Social Launch Kit in the docs.

Publishing rules

- Stripe test mode only. No real keys, customers or emails on screen.
- The signed-in admin email is hidden while recording (`qa/showcase/admin-session.ts`).
- Nothing goes into post copy until every clip and slide has been reviewed.
