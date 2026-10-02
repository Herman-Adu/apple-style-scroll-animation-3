# AGENTS.md

Shared rules for every coding agent on this repo (v0, Claude Code, Codex, Hermes, humans).
Stack: Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Prisma on Neon, Better Auth, Stripe, Resend, Vitest + Playwright in `qa/`.

## Load only what the task needs

Read this file, then open **only** the skill that matches the task. Skills link to `references/` for detail; open those only when a step needs them.

| Task | Skill |
|---|---|
| Start, resume, ship or merge a sprint; "where are we" | `.agents/skills/sprint-workflow/` |
| Turn a spec or brain-dump into sprints | `.agents/skills/spec-to-plan/` |
| Write tests, pick a test layer, red/green | `.agents/skills/test-first/` |
| Components, data fetching, caching, forms, `useEffect` | `.agents/skills/react-next-patterns/` |
| Types, naming, mutation, duplication | `.agents/skills/typescript-clean-code/` |
| Where a file goes, imports between features | `.agents/skills/feature-slices/` |
| Smells, seams, health check, refactor planning | `.agents/skills/architecture-review/` |
| Prisma schema or data changes | `.agents/skills/db-schema-change/` |
| Sign-in, sessions, roles, Better Auth CLI | `.agents/skills/better-auth-ops/` |
| Vercel CLI, env, previews, logs, production release | `.agents/skills/vercel-ops/` |
| End of sprint: lessons into rules | `.agents/skills/sprint-retro/` |

## Non-negotiables

1. **Never commit to `main`.** One sprint = one `v0/<id>-<name>` branch = one PR = squash-merge. Branch from the real `main`.
2. **Test first.** Write the failing test, see it fail for the right reason, then implement.
3. **Green before merge:** `tsc`, lint, unit, integration, and the browser tests (smoke + axe). A failure gets fixed in the same sprint; never merge red.
4. **After merge:** refresh `main`, confirm it points at the merge commit, update the ledger in `docs/next-steps.md`.
5. **Admin server actions** start with `await requireAdmin()`; permission rules live in `lib/auth/permissions.ts`.
6. **Schema changes are additive** unless the user approves otherwise.
7. **Reuse before you build:** search `features/`, `lib/` and `components/ui/` first.

## Gates (stop and get explicit approval)

- Production deploy, promote or alias.
- Deleting or rewriting existing data; non-additive schema changes.
- Repo settings (rulesets, branch protection, secrets).
- Secrets: the user adds them in Vars / GitHub settings. Never ask for a value in chat.

"ok", "yes and..." or silence is not approval for a gate.

## Where things are

- Plans: `v0_plans/*.md`. Ledger: `docs/next-steps.md`. ADRs: in-app `/docs/architecture-decision-records`.
- Tests: `qa/unit`, `qa/integration` (Vitest), `qa/smoke`, `qa/seo`, `qa/axe` (Playwright). Always use the `pnpm test:*` scripts.
- Known sandbox problems and fixes: `.agents/skills/sprint-workflow/references/troubleshooting.md`.

## Keep this system honest

Skills are code: change them in a PR. `qa/unit/meta/skills.test.ts` checks every skill is routed here, stays under 120 lines, and only links to files that exist. Keep this file under 80 lines.
