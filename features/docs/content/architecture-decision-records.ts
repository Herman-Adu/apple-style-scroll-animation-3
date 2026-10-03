import type { Doc } from "../lib/schema"

export const architectureDecisionRecords: Doc = {
  slug: "architecture-decision-records",
  title: "Architecture Decision Records",
  category: "Architecture",
  audience: "developer",
  access: "public",
  summary:
    "The key design decisions behind the email platform and permissions, each with the context, the choice, the alternatives considered and the trade-offs accepted. Read this before changing how templates, versions, locks or sends work.",
  readingMinutes: 10,
  order: 3,
  updatedAt: "2026-10-02",
  tags: ["adr", "decisions", "architecture", "email", "permissions", "trade-offs"],
  body: [
    {
      type: "paragraph",
      text: "Each record is short on purpose: what we decided, why, and what it costs. If a decision changes, add a new record that supersedes the old one rather than editing history, the same rule the template versions follow.",
    },
    {
      type: "table",
      title: "Index",
      headers: ["ADR", "Decision", "Status"],
      rows: [
        ["001", "Store templates as typed blocks in one JSON column", "Accepted"],
        ["002", "One renderer for editor, preview and sender", "Accepted"],
        ["003", "Own the email stack (Resend + Neon) instead of renting an ESP", "Accepted"],
        ["004", "Snapshot every template write; restore appends, never rewinds", "Accepted"],
        ["005", "Saved sections are copied on insert, not linked", "Accepted"],
        ["006", "Starters live in code, not in the database", "Accepted"],
        ["007", "Permissions as pure rules, enforced in three layers", "Accepted"],
        ["008", "Lockers configured by environment variable for now", "Accepted, revisit"],
        ["009", "Scheduled sends use a separate server-only path", "Accepted"],
        ["010", "Tests first for rules; in-memory Prisma for integration tests", "Accepted"],
      ],
    },
    { type: "heading", text: "ADR-001 — Typed blocks in one JSON column" },
    {
      type: "paragraph",
      text: "Context: templates are an ordered list of different block types (heading, text, image, button, product picks, divider) and new types are added often. Decision: store them as a typed array in EmailTemplate.blocks. Alternatives: a table per block type, or one blocks table with a type column. Trade-off: no SQL-level validation of block fields, so TypeScript types and the renderer are the contract. In return, adding a block type or a field such as locked needs no migration.",
    },
    { type: "heading", text: "ADR-002 — One renderer everywhere" },
    {
      type: "paragraph",
      text: "Context: the biggest risk in email builders is a preview that doesn't match the inbox. Decision: the editor preview, the campaign preview and the sender all call the same render function. Trade-off: the preview runs real email HTML in an iframe, which is heavier than a React mock. In return, what admins see is what customers get, and dark-mode fixes land everywhere at once.",
    },
    { type: "heading", text: "ADR-003 — Own the email stack" },
    {
      type: "paragraph",
      text: "Context: per-contact ESP pricing rises with every subscriber. Decision: Resend for delivery, with templates, campaigns and logs stored in Neon. Trade-off: we build features an ESP has out of the box (analytics, A/B tests). In return, cost stays flat as the list grows, and data and branding stay in one place.",
    },
    { type: "heading", text: "ADR-004 — Version every write" },
    {
      type: "paragraph",
      text: "Context: admins make mistakes, and an email that has gone out cannot be recalled. Decision: every create, save, reset and restore writes an EmailTemplateVersion row with a reason. Restoring copies an old version forward as a new version. Trade-off: more rows, capped at 50 per template with the original always kept. In return, history is never lost, and Reset to original works for system templates.",
    },
    { type: "heading", text: "ADR-005 — Sections are copies" },
    {
      type: "paragraph",
      text: "Context: a saved section could either link to one shared source or be copied into each template. Decision: copy, with fresh block ids on every insert. Trade-off: updating a saved section doesn't update templates that already use it. In return, deleting or editing a section can never break a live template, and each copy can be tweaked locally.",
    },
    { type: "heading", text: "ADR-006 — Starters in code" },
    {
      type: "paragraph",
      text: "Context: the starter gallery (Newsletter, Sale, Black Friday, Christmas and so on) needs to be the same in every environment. Decision: starters are defined in features/email/lib/content/starters.ts, and choosing one creates a normal template. Trade-off: adding a starter needs a deploy. In return, starters are reviewed, tested and versioned like code.",
    },
    { type: "heading", text: "ADR-007 — Pure permission rules, three layers" },
    {
      type: "mermaid",
      kind: "architecture",
      title: "Figure 1 — Where each check lives",
      diagram: [
        "flowchart TB",
        "  R[lib/auth/permissions.ts<br/>pure rules, unit tested]",
        "  P[proxy.ts<br/>admin gate for /admin]",
        "  S[Server actions<br/>requireAdmin + canLock + lockViolations]",
        "  U[Editor UI<br/>hides lock toggle]",
        "  R --> P",
        "  R --> S",
        "  R --> U",
      ].join("\n"),
    },
    {
      type: "paragraph",
      text: "Context: the email admin actions had no caller checks, and the UI alone can always be bypassed. Decision: put the rules in one pure module and enforce them in the proxy, again in every server action, and reflect them in the UI. Trade-off: some checks run twice. In return, no single missed check opens a hole, and the rules are tested without HTTP.",
    },
    { type: "heading", text: "ADR-008 — Lockers by environment variable" },
    {
      type: "paragraph",
      text: "Context: only a few people need to lock blocks. Decision: owners can always lock, plus anyone listed in the server-only EMAIL_BLOCK_LOCKERS variable. Trade-off: changing who can lock needs an environment change and a redeploy. Status: superseded by ADR-011. The variable remains as a fallback seed.",
    },
    { type: "heading", text: "ADR-009 — Separate path for scheduled sends" },
    {
      type: "paragraph",
      text: "Context: scheduled sends run with no one signed in, so the admin check would block them. Decision: the sending logic lives in features/email/lib/sending/campaign-send.ts. The admin action wraps it with requireAdmin, and the cron route calls it only with a valid CRON_SECRET. Trade-off: two entry points to maintain. In return, neither path weakens the other.",
    },
    { type: "heading", text: "ADR-010 — How we test" },
    {
      type: "paragraph",
      text: "Context: tests that need a database or browser are slow and flaky. Decision: rules live in pure modules with unit tests written first. Server actions are integration-tested against an in-memory Prisma mock, and Playwright covers smoke, SEO and accessibility. Trade-off: the mock can drift from Postgres behaviour. In return, the full unit and integration run takes seconds.",
    },
    { type: "heading", text: "ADR-011 — Lock permissions stored in the database" },
    {
      type: "paragraph",
      text: "Context: ADR-008 meant every change to who can lock needed a redeploy, with no record of who changed what. Decision: lock rights live in a database table, granted and revoked by the owner in Admin → Settings → Permissions, and every change writes an audit row. The owner always has the right, and EMAIL_BLOCK_LOCKERS still works as a read-only fallback seed. The rules stay pure (canGrantPermission, resolveLockRights) and the lookup is cached per request with React cache(). Trade-off: one extra query per admin request. In return, changes take effect immediately and are fully auditable.",
    },
  ],
}
