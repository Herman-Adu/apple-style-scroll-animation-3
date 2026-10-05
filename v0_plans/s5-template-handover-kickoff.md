# S5 kickoff prompt (new chat)

Use this prompt to start the next session and execute **S5** first.

---

Start from current repo state and run **S5** as a new sprint.

Repo:

- C:/Users/herma/source/repository/apple-style-scroll-animation-3
- Windows + PowerShell + pnpm
- Current branch: main

Read first:

- AGENTS.md
- docs/next-steps.md (S5 + shipped ledger rows)
- docs/architecture-health.md
- README.md
- Use matching skills per step:
  - sprint-workflow
  - test-first
  - feature-slices
  - typescript-clean-code

Security/ops constraint:

- Do not print, grep-dump, or echo env variable values in chat.
- Refer to env vars by name only.

Non-negotiables:

- Never commit to main. One sprint = one branch + one PR + squash merge.
- Test first (red -> green).
- Keep behavior-change scope strictly S5; no unrelated refactors.

S5 objective:

- Deliver template handover instead of production go-live:
  1. Add `docs/template-handover.md` with clear fork/customize guidance.
  2. Add a template-vs-live-product note at the top of `README.md`.
  3. Run and document a final gap analysis against architecture-health baseline.
  4. Close the ledger status so future chats can start from clean context.

Required approach:

1. Orient + branch from real main:
   - git status --short
   - git branch --show-current
   - git log --oneline -5
   - git fetch origin +refs/heads/main:refs/remotes/origin/main
   - git checkout -B v0/s5-template-handover origin/main

2. TDD first (where behavior is testable):
   - Add/adjust docs/meta tests first if coverage exists for the touched docs paths.
   - Keep tests minimal and focused on S5 outputs.

3. Implementation constraints:
   - No production deploy work.
   - No Stripe live-key rollout work.
   - Keep scope to template handover + docs + gap analysis only.

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
   - Update docs/next-steps.md ledger with S5 PR number and summary.

Out of scope:

- Any unrelated architecture, auth, checkout, or deployment work.

---

Expected handoff report format:

- S5 outcomes completed
- Exact files changed
- Red tests added and what they proved
- Green validations run
- PR #, merge SHA, ledger update
