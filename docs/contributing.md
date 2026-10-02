# Contributing

The full guide with diagrams is in the app at `/docs/contributing-and-workflow`. This is the short version.

## The loop

1. Branch from `main` (`v0/<short-name>`). Never commit to `main` directly.
2. Write the failing test first. Put rules in a small pure module and test them in `qa/unit`.
3. Implement the rule, then wire it into server actions and the UI.
4. Every admin server action calls `await requireAdmin()` on its first line, and permission checks live in `lib/auth/permissions.ts`. The proxy is defence in depth, not a replacement.
5. Run the checks:
   ```bash
   pnpm exec tsc --noEmit
   pnpm test:unit
   pnpm test:integration
   ```
6. Update `docs/*.md` and the matching in-app guide in `features/docs/content/`, and bump `updatedAt`.
7. Open one pull request per feature, then squash-merge and delete the branch.

## Schema changes

Make additive changes only (new tables or nullable columns), regenerate the Prisma client, and say in the PR that existing data is untouched.

## Why things are the way they are

See the in-app **Architecture Decision Records** guide (`/docs/architecture-decision-records`).
