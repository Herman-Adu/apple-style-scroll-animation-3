import type { Doc } from "../schema"

export const caseStudyEmailPlatform: Doc = {
  slug: "case-study-email-platform",
  title: "Case Study: An Owned Email Platform Inside the Store",
  category: "Business Case",
  audience: "cto",
  access: "public",
  summary:
    "How a block-based email builder, seasonal campaign starters and a defence-in-depth permissions model were added to a Next.js commerce platform in small, test-first pull requests, and what that means for a business weighing build against buy.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-10-02",
  tags: ["case study", "email", "commerce", "security", "tdd", "build vs buy"],
  body: [
    { type: "heading", text: "The problem" },
    {
      type: "paragraph",
      text: "Store teams usually run email in a separate subscription tool. Products and prices are copied in by hand, branding drifts between campaigns, anyone with access can change the logo or legal footer, and customer data lives in a second system. Seasonal peaks like Black Friday and Christmas make all of this worse, because campaigns are rushed.",
    },
    { type: "heading", text: "What was built" },
    {
      type: "table",
      headers: ["Capability", "Outcome for the business"],
      rows: [
        ["Block-based templates with Product picks", "Emails show real catalog products and live prices, so nothing is copied or goes stale."],
        ["Starter gallery with seasonal campaigns", "Black Friday, Bank Holiday and Christmas emails start from a polished design instead of a blank page."],
        ["Saved sections and locked blocks", "Brand headers and footers are reused everywhere and can't be changed by accident."],
        ["Version history and Reset to original", "Every save is recorded and reversible, so mistakes are cheap to fix."],
        ["Placeholder picker with typo warnings", "Personalised fields are inserted from a list, and broken tokens are caught before sending."],
        ["Permissions in proxy, server and UI", "Sensitive actions are protected even if one layer is misconfigured."],
      ],
    },
    {
      type: "image",
      src: "/docs/showcase/email-christmas.png",
      alt: "Rendered Christmas campaign email with a festive hero image, headline, product section and call-to-action button.",
      caption: "The Christmas starter as a customer receives it, rendered by the platform's own email renderer.",
      width: 680,
      height: 1148,
    },
    { type: "heading", text: "How it was delivered" },
    {
      type: "list",
      items: [
        "Small pull requests (PRs #70 to #87), each with one clear purpose, reviewed and squash-merged into main.",
        "Tests written first: the lock, placeholder, section and permission rules are pure functions with unit tests, and server actions have integration tests.",
        "Business rules live outside the UI and are enforced again on the server, so the browser is never trusted.",
        "Building the lock permission exposed a real gap: email server actions relied on the page to check the user. Every action now checks the caller itself.",
        "Documentation shipped alongside the code for five audiences, including architecture, sequence and ER diagrams.",
      ],
    },
    { type: "heading", text: "Results" },
    {
      type: "table",
      headers: ["Measure", "Result"],
      rows: [
        ["Email image weight", "7.6 MB down to 1.25 MB with no visible quality loss"],
        ["Version safety", "Last 50 saves restorable per template, original always kept"],
        ["Permission layers", "3 independent checks for admin access and lock permission"],
        ["Campaign starters", "4 essentials plus 3 seasonal campaigns"],
        ["Extra subscriptions needed", "None. Email runs inside the platform alongside orders and customers."],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "What's next",
      text: "Scheduled sends are built and tested but not yet switched on. Next on the roadmap: a screen to manage who can lock blocks, an audit log of lock and restore actions, and campaign analytics. See What's New for the full changelog.",
    },
  ],
}
