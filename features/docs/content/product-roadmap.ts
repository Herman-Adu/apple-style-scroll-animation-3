import type { Doc } from "../schema"

export const productRoadmap: Doc = {
  slug: "product-roadmap-and-phase-2",
  title: "Product Roadmap & Phase 2",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "What is shipped, what is next, and what is later — the honest roadmap. Use it to show depth in a pitch (there is a credible plan beyond today), to scope paid phases with a client, and to keep your own build sequence clear. Each item lists its value, rough effort, and dependency.",
  readingMinutes: 8,
  order: 7,
  updatedAt: "2026-09-26",
  tags: ["roadmap", "phase 2", "planning", "positioning", "scope"],
  body: [
    {
      type: "paragraph",
      text: "A roadmap is a sales asset as much as a planning tool. It proves the build is a foundation with a credible future, not a one-off. In a pitch it lets you say 'here is what it does today, and here is exactly where it goes next' — and each 'later' item is a scopable paid phase.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "Now / Next / Later, not dates",
      text: "Avoid committing to calendar dates you cannot control. Framing work as Now, Next, and Later communicates sequence and intent without setting a deadline you might miss in front of a client.",
    },
    {
      type: "heading",
      text: "Now — shipped and live",
    },
    {
      type: "list",
      items: [
        "Server-first storefront with cart and Stripe checkout (server-side total recomputation).",
        "Admin dashboard for catalog, orders, and email.",
        "Owned email platform: block-based templates, campaigns, and 1:1 customer messaging on Resend + Neon Postgres.",
        "Better Auth authentication on Neon with server-enforced role-based access.",
        "Unified send log for transactional, campaign, and customer messages.",
        "Multi-audience documentation library with architecture, sequence, and ER diagrams, plus instant Strapi cache revalidation via webhook.",
      ],
    },
    {
      type: "heading",
      text: "Next — high value, well understood",
    },
    {
      type: "table",
      title: "Next phase",
      headers: ["Feature", "Value", "Effort", "Depends on"],
      rows: [
        [
          "Open & click tracking + analytics dashboard",
          "Turn the send log into performance insight; prove campaign ROI",
          "Medium",
          "Resend webhooks",
        ],
        [
          "Scheduled campaigns & send windows",
          "Queue sends for the right time instead of sending immediately",
          "Medium",
          "A scheduler / cron",
        ],
        [
          "Template version history & rollback",
          "Safe editing — recover a previous template if an edit goes wrong",
          "Low–Medium",
          "A versions table",
        ],
        [
          "A/B subject testing",
          "Lift open rates by testing subject lines on a sample first",
          "Medium",
          "Tracking + scheduling",
        ],
      ],
    },
    {
      type: "heading",
      text: "Later — higher effort or larger scope",
    },
    {
      type: "table",
      title: "Later phase",
      headers: ["Feature", "Value", "Effort", "Depends on"],
      rows: [
        [
          "Two-way inbox",
          "Receive and thread customer replies inside the dashboard, not a separate mailbox",
          "High",
          "Resend inbound + webhook handling",
        ],
        [
          "Order-based audience segments",
          "Target campaigns by real purchase history (e.g. lapsed buyers, VIPs)",
          "High",
          "Migrating orders/customers to Neon",
        ],
        [
          "Role-based access for larger teams",
          "Finer permissions beyond admin/user for bigger operations",
          "Medium–High",
          "Expanded auth roles",
        ],
        [
          "White-label multi-tenant deploys",
          "Run multiple brands or clients from one codebase — an agency upsell",
          "High",
          "Per-tenant settings + data isolation",
        ],
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "The migration that unlocks the most",
      text: "Several 'later' items (order-based segments especially) depend on moving orders and customers onto Neon Postgres alongside email. That single migration is the highest-leverage next investment — it is documented in the Data Layer and Strapi migration guides.",
    },
    {
      type: "heading",
      text: "Using the roadmap in a pitch",
    },
    {
      type: "steps",
      items: [
        {
          title: "Show 'Now' to establish it is real",
          text: "Lead with what is shipped and live so the buyer trusts the foundation before you talk about the future.",
        },
        {
          title: "Use 'Next' to scope a paid phase",
          text: "Each Next item is a natural fixed-price engagement. Let the client pick the one that maps to their pain.",
        },
        {
          title: "Use 'Later' to signal depth",
          text: "You do not have to build these to benefit from them — naming them credibly shows you have thought past launch.",
        },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "A roadmap earns trust",
      text: "Buyers and hiring managers both respond to a clear, honest plan. It says you see the whole board, not just the current move — which is exactly the signal a senior engineer or a reliable vendor should send.",
    },
  ],
}
