import type { Doc } from "../schema"

export const whatsNew: Doc = {
  slug: "whats-new",
  title: "What's New",
  category: "Technology Strategy",
  audience: "cto",
  access: "public",
  summary:
    "A plain-English changelog of what has shipped, newest first, with links to the guides that explain each change. The page to link from LinkedIn, Facebook, Telegram and X posts.",
  readingMinutes: 5,
  order: 0,
  updatedAt: "2026-10-02",
  tags: ["changelog", "release notes", "whats new", "showcase"],
  body: [
    {
      type: "paragraph",
      text: "Every change here shipped as its own reviewed pull request (PRs #63 to #86), with tests written before the code. Each entry says who benefits and where to read more.",
    },
    {
      type: "chart",
      chartType: "bar",
      title: "Pull requests shipped, 1 to 2 October 2026",
      caption: "24 merged pull requests across five areas in two days.",
      xKey: "area",
      data: [
        { area: "Email builder", prs: 11 },
        { area: "Transactional email", prs: 5 },
        { area: "Security", prs: 1 },
        { area: "Performance", prs: 1 },
        { area: "Docs", prs: 5 },
        { area: "Fixes & cleanup", prs: 1 },
      ],
      series: [{ key: "prs", label: "Pull requests", color: "var(--chart-1)" }],
    },
    { type: "heading", text: "Documentation for every audience" },
    {
      type: "list",
      items: [
        "Security posture rewritten with a who-can-do-what table and a defence-in-depth diagram (PR #84). See /docs/security-and-compliance-posture.",
        "New email platform architecture guide with database, sequence, state and flow diagrams (PR #84). See /docs/email-platform-architecture.",
        "Engineering quality page, architecture decision records and a contributing guide (PR #85). See /docs/engineering-quality.",
        "Seasonal campaign walkthrough with real rendered emails, plus a platform glossary (PR #86). See /docs/email-seasonal-campaigns and /docs/platform-glossary.",
      ],
    },
    { type: "heading", text: "Security: lock permissions with defence in depth" },
    {
      type: "paragraph",
      text: "Only the owner and admins named in a server-only allow-list can lock or unlock email blocks. The rule lives in one module and is enforced in three independent places: the proxy, every server action and the editor UI. The same change added an admin check to every email admin action, closing a gap where those actions did not verify the caller (PR #83).",
    },
    { type: "heading", text: "Email builder" },
    {
      type: "table",
      headers: ["Feature", "What it does", "PR"],
      rows: [
        ["Locked blocks", "Protect the brand header and footer from accidental edits, moves or deletes. New blocks go between locked edges.", "#81"],
        ["Starter gallery", "Start from Newsletter, Product launch, Sale, Announcement, or seasonal campaigns: Black Friday, Bank Holiday and Christmas, each with its own hero image.", "#79"],
        ["Saved sections", "Save a group of blocks once, insert an independent copy into any template.", "#78"],
        ["Placeholder picker", "Insert tokens like {{customer_name}} from a menu; unknown tokens are flagged before they reach a customer.", "#77"],
        ["Version history", "Every save is recorded. Restore any of the last 50; Reset to original on system templates.", "#76"],
        ["Editor safety", "Discard changes, a guard against leaving with unsaved work, and Duplicate.", "#74"],
        ["Product picks", "Show real catalog products with live prices and images inside an email.", "#70"],
        ["Shared preview", "Template and campaign editors use one preview pane, with dark-mode-safe rendering.", "#71, #72"],
      ],
    },
    { type: "heading", text: "Transactional email" },
    {
      type: "list",
      items: [
        "New order notification, refund confirmation and low stock templates, with a standard support address (PR #65).",
        "Product thumbnails and prices in order emails, templates grouped by category (PRs #66 to #69).",
        "Low stock alerts now fire only after the stock reservation commits, and the admin view refreshes live (PR #63).",
      ],
    },
    { type: "heading", text: "Performance and quality" },
    {
      type: "list",
      items: [
        "Email hero images shrunk from 7.6 MB to 1.25 MB with no visible quality loss (PR #80).",
        "A dedicated test catch-up sprint before new features (PR #75); every feature since then was written test-first.",
        "Scheduled campaign sends were moved to a server-only path so the new admin checks protect people, not the cron job.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Sharing this page",
      text: "Link to /docs/whats-new from social posts. It has its own preview image, so the link shows a branded card on LinkedIn, Facebook, Telegram and X.",
    },
  ],
}
