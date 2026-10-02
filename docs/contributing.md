# Contributing

The full guide with diagrams is in the app at `/docs/contributing-and-workflow`. This is the short version.

## Agent rules and skills

`AGENTS.md` (read by v0, Claude Code via `CLAUDE.md`, Codex and others) holds the non-negotiables and routes each task to one skill in `.agents/skills/`. Skills change through PRs like code; `qa/unit/meta/skills.test.ts` keeps them routed, small and with working links.

## The loop

1. Branch from the **real** `main`. Run `git fetch origin +refs/heads/main:refs/remotes/origin/main`, check the SHA matches GitHub, then `git checkout -B v0/<short-name> origin/main`. Never commit to `main` directly. (A plain `git fetch origin main` doesn't move `origin/main`; see `docs/next-steps.md`.)
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
7. Check `git diff --stat origin/main` lists only your files, so nothing merged earlier is being reverted.
8. Open one pull request per feature, then squash-merge and delete the branch. Confirm main moved to the merge commit and add a row to the sprint ledger in `docs/next-steps.md`.

## Schema changes

Make additive changes only (new tables or nullable columns), regenerate the Prisma client, and say in the PR that existing data is untouched.

## Why things are the way they are

See the in-app **Architecture Decision Records** guide (`/docs/architecture-decision-records`).
