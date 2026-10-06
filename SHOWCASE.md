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

Publishing rules

- Stripe test mode only. No real keys, customers or emails on screen.
- The signed-in admin email is hidden while recording (`qa/showcase/admin-session.ts`).
- Nothing goes into post copy until every clip and slide has been reviewed.
