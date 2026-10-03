import type { Doc } from "../lib/schema"

export const contributingAndWorkflow: Doc = {
  slug: "contributing-and-workflow",
  title: "Contributing & Workflow",
  category: "DevOps",
  audience: "developer",
  access: "public",
  summary:
    "How to make a change safely: branch naming, tests first, which test suite covers what, the checks to run before a pull request, and how docs are kept in step with the code.",
  readingMinutes: 6,
  order: 2,
  updatedAt: "2026-10-02",
  tags: ["contributing", "workflow", "testing", "tdd", "pull requests", "vitest", "playwright"],
  body: [
    {
      type: "steps",
      items: [
        { title: "Branch from the real main", text: "Refresh origin/main with an explicit refspec (git fetch origin +refs/heads/main:refs/remotes/origin/main), check its SHA matches GitHub, then branch from it, for example v0/s1-permissions. Never commit directly to main." },
        { title: "Write the failing test", text: "Put pure rules in a small module (for example features/email/lib/content/locks.ts) and write its unit tests first. Run them and confirm they fail for the right reason." },
        { title: "Implement the rule", text: "Make the tests pass without touching the UI." },
        { title: "Wire it in", text: "Call the rule from server actions, enforce permissions there, then reflect it in the UI. Add an integration test for the server action." },
        { title: "Run the checks", text: "pnpm exec tsc --noEmit, pnpm test:unit and pnpm test:integration must all pass. For UI changes, run the smoke tests or check the page in a browser." },
        { title: "Update the docs", text: "Update the developer docs in docs/*.md and the in-app guide for the affected audience. Bump updatedAt." },
        { title: "Check the diff scope", text: "git diff --stat origin/main must list only this change's files. Anything else means the branch started from a stale tree and would revert merged work." },
        { title: "Open a pull request", text: "One feature per PR, described in plain language. Squash-merge, confirm main moved to the merge commit, and add a row to the sprint ledger in docs/next-steps.md before starting the next sprint." },
      ],
    },
    { type: "heading", text: "Which suite covers what" },
    {
      type: "table",
      headers: ["Command", "Covers", "Needs"],
      rows: [
        ["pnpm test:unit", "Pure rules: permissions, locks, sections, starters, versions, placeholders, rendering, mappers, SEO", "Nothing, runs in seconds"],
        ["pnpm test:integration", "Server actions and routes with in-memory Prisma and mocked auth", "Nothing"],
        ["pnpm test:smoke", "Key pages load in a real browser", "Running dev server"],
        ["pnpm test:axe", "Accessibility checks", "Running dev server"],
        ["pnpm test:seo", "Metadata and structured data", "Running dev server"],
      ],
    },
    { type: "heading", text: "Where things go" },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — Deciding where code belongs",
      diagram: [
        "flowchart TD",
        "  Q{What are you adding?}",
        "  Q -- A rule or calculation --> A[Pure module in features/*/ or lib/<br/>+ unit test in qa/unit]",
        "  Q -- A permission --> B[lib/auth/permissions.ts<br/>+ enforce in server action]",
        "  Q -- A database read/write --> C[features/*/repo.ts]",
        "  Q -- An admin mutation --> D[features/*/admin-actions.ts<br/>requireAdmin first line<br/>+ integration test]",
        "  Q -- UI --> E[features/admin/components<br/>Server Component by default]",
      ].join("\n"),
    },
    {
      type: "callout",
      variant: "warning",
      title: "Every admin action starts with requireAdmin()",
      text: "The proxy is a first line of defence, not the only one. A new server action without requireAdmin() as its first line is a security bug, even if the page that calls it is already protected.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "Schema changes",
      text: "Add the model to prisma/schema.prisma, apply additive changes only (new tables or nullable columns), regenerate the client, and say in the PR that existing data is untouched.",
    },
  ],
}
