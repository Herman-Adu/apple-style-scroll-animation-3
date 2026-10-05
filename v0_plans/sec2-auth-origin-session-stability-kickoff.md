# SEC2 kickoff prompt (new chat)

Use this prompt to start the next session and execute SEC2 first.

---

Start from current repo state and run **SEC2** as a new sprint.

Repo:

- C:/Users/herma/source/repository/apple-style-scroll-animation-3
- Windows + PowerShell + pnpm
- Current branch: main

Read first:

- AGENTS.md
- docs/next-steps.md (SEC2 section)
Use matching skills per step:
- sprint-workflow, test-first, better-auth-ops, react-next-patterns, typescript-clean-code, feature-slices

Security constraint:

- **Do not print, grep-dump, or echo env variable values in chat.**
- Refer to env vars by name only.

Non-negotiables:

- Never commit to main. One sprint = one branch + one PR + squash merge.
- Test first (red -> green).
- Keep behavior-change scope strictly SEC2; no unrelated refactors.

SEC2 objective:
Fix both:

1. mobile/desktop Better Auth `Invalid Origin` on email/password sign-in in production,
2. user session appearing signed-out after checkout return/continue-shopping.

Hypothesis to validate:

- Host/origin drift between Better Auth host resolution/trusted origins and Stripe return URL origin resolution (custom domain vs forwarded/proxy/preview host).

Required approach:

1. Orient + branch from real main:
   - git status --short
   - git branch --show-current
   - git log --oneline -5
   - git fetch origin +refs/heads/main:refs/remotes/origin/main
   - git checkout -B v0/sec2-auth-origin-session-stability origin/main

2. TDD first:
   - Add failing tests around host/origin resolution for auth + checkout return URL generation.
   - Add failing test(s) proving canonical custom host consistency through checkout return URL construction.

3. Implementation constraints:
   - Keep CSRF/origin checks enabled (no security downgrades).
   - Harden Better Auth config for multi-host Vercel/custom-domain reality using dynamic baseURL host allowlist + trusted proxy headers in production.
   - Make checkout return origin deterministic and canonical/validated, not opportunistically drifting by forwarded host.
   - Keep public APIs/slice boundaries stable unless SEC2 needs a change.

4. Validation gates:
   - pnpm exec tsc --noEmit
   - pnpm lint
   - pnpm test
   - pnpm arch
   - pnpm build
   - pnpm test:smoke
   - pnpm test:axe

5. Ship:
   - Open PR with tests run and data impact.
   - Wait CI green.
   - Squash merge.
   - Refresh local main to merge commit.
   - Update docs/next-steps.md ledger with SEC2 PR number and summary.

Out of scope:

- Any unrelated architecture, UX, or deployment work.

---

Expected handoff report format:

- Root cause confirmed
- Exact files changed
- Red tests added and what they proved
- Green validations run
- PR #, merge SHA, ledger update
