import type { Doc } from "../lib/schema";

export const engineeringQuality: Doc = {
  slug: "engineering-quality",
  title: "Engineering Quality & Delivery",
  category: "Technology Strategy",
  audience: "cto",
  access: "public",
  summary:
    "How this platform is built: tests written before code, one reviewed pull request per feature, permission checks in three layers, and a visible record of what shipped. Includes the real delivery log for the email builder (PRs #63–#84) and how the test suite grew with it.",
  readingMinutes: 7,
  order: 3,
  updatedAt: "2026-10-04",
  tags: [
    "quality",
    "testing",
    "tdd",
    "delivery",
    "pull requests",
    "process",
    "cto",
  ],
  body: [
    {
      type: "paragraph",
      text: "Buyers and hiring managers often ask the same thing: can this be trusted, and can it be maintained? This page answers with evidence from the repository rather than promises. Every number here comes from the merged history.",
    },
    {
      type: "table",
      title: "Quality at a glance",
      headers: ["Practice", "What it means here", "Evidence"],
      rows: [
        [
          "Tests first",
          "Rules are written as failing tests, then implemented",
          "Lock permissions: 27 new tests confirmed failing before any code was written",
        ],
        [
          "One PR per feature",
          "Each sprint ships as a single reviewed, squash-merged pull request",
          "22 merged PRs (#63–#84) for the email builder and its docs",
        ],
        [
          "Defence in depth",
          "Permissions enforced in the proxy, in server actions and in the UI",
          "Security & Compliance Posture guide, Figure 1",
        ],
        [
          "Type safety",
          "Strict TypeScript, Zod at trust boundaries",
          "Type-check runs clean before every merge",
        ],
        [
          "Non-destructive by default",
          "Every template change is versioned; restore adds a version",
          "Version history and Reset to original",
        ],
        [
          "Docs ship with code",
          "Developer and in-app docs updated alongside features",
          "PRs #82 and #84",
        ],
      ],
    },
    { type: "heading", text: "How a feature gets built" },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — The delivery loop",
      caption:
        "Pure rules live in small modules so they can be tested without a database or a browser.",
      diagram: [
        "flowchart LR",
        "  A[Agree the scope] --> B[Write failing tests]",
        "  B --> C[Implement pure rules module]",
        "  C --> D[Wire server actions and UI]",
        "  D --> E{Type-check, unit and integration tests pass?}",
        "  E -- no --> C",
        "  E -- yes --> F[Branch + pull request]",
        "  F --> G[Squash-merge to main]",
        "  G --> H[Docs updated]",
      ].join("\n"),
    },
    { type: "heading", text: "The test suite grew with the product" },
    {
      type: "chart",
      chartType: "area",
      title: "Figure 2 — Test cases declared in the repository, by merged PR",
      caption:
        "Counted from the source at each merge commit. The runtime count is higher (165 at PR #83: 131 unit + 34 integration) because some tests run once per input.",
      xKey: "pr",
      data: [
        { pr: "#74", tests: 52 },
        { pr: "#75", tests: 70 },
        { pr: "#76", tests: 80 },
        { pr: "#77", tests: 93 },
        { pr: "#78", tests: 103 },
        { pr: "#79", tests: 117 },
        { pr: "#81", tests: 131 },
        { pr: "#83", tests: 158 },
      ],
      series: [
        { key: "tests", label: "Test cases", color: "var(--color-chart-2)" },
      ],
    },
    {
      type: "paragraph",
      text: "The test count tripled in one day of delivery, and every feature after Sprint T arrived with its own tests. Sprint T itself was a deliberate catch-up sprint: before building more of the editor, the existing renderer, copy rules and reset path were covered so later changes couldn't silently break them.",
    },
    { type: "heading", text: "Delivery log: the email builder" },
    {
      type: "table",
      title: "What shipped, PR by PR",
      headers: ["PR", "Change", "Why it matters"],
      rows: [
        [
          "#63–#64",
          "Low-stock alerts fire only after stock is reserved; live refresh",
          "No false alarms; admins see changes without reloading",
        ],
        [
          "#65–#69",
          "Order, refund and low-stock templates; product thumbnails and prices",
          "Every customer touchpoint is branded",
        ],
        ["#70", "Product picks block", "Feature several products in one email"],
        [
          "#71–#72",
          "Shared preview pane; dark-mode-safe rendering",
          "What admins see matches every inbox",
        ],
        [
          "#73–#74",
          "Reset fix; Discard, Duplicate, unsaved-changes guard",
          "No lost work",
        ],
        ["#75", "Test catch-up sprint", "A safety net before going faster"],
        [
          "#76",
          "Version history, restore, Reset to original",
          "Any mistake can be undone",
        ],
        [
          "#77",
          "Placeholder picker and typo warnings",
          "No broken {{first_name}} in live sends",
        ],
        [
          "#78",
          "Saved sections",
          "Build a brand header once, reuse everywhere",
        ],
        [
          "#79",
          "Starter gallery incl. Black Friday, Christmas, Bank Holiday",
          "A campaign in minutes, not hours",
        ],
        ["#80", "Hero images 7.6 MB to 1.25 MB", "Faster emails and editor"],
        [
          "#81",
          "Locked blocks",
          "Protect brand header and footer from accidental edits",
        ],
        [
          "#82, #84",
          "Developer and in-app docs catch-up, diagrams",
          "Docs match the product",
        ],
        [
          "#83",
          "Lock permissions: owners and named admins, three-layer enforcement",
          "Closed a real gap: email admin actions now check who is calling",
        ],
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "Honest about gaps",
      text: "Quality also means saying what isn't finished. The full click-through browser test is skipped until a dedicated test admin account exists, and scheduled sends are built and tested but not switched on. Both are tracked on the roadmap.",
    },
    { type: "heading", text: "What a reviewer can check in ten minutes" },
    {
      type: "list",
      items: [
        "Run pnpm test: unit and integration suites finish in seconds with no database or network.",
        "Open lib/auth/permissions.ts: every permission rule is a small pure function with its own tests.",
        "Open features/email/lib/domain/content/locks.ts: lock rules are separate from the UI and enforced again on the server.",
        "Read the Architecture Decision Records guide for the reasoning behind the main design choices.",
      ],
    },
  ],
};
