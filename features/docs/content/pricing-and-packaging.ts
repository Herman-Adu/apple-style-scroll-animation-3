import type { Doc } from "../schema"

export const pricingAndPackaging: Doc = {
  slug: "pricing-and-packaging-the-build",
  title: "Pricing & Packaging the Build",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "Turn the platform into an offer: how to package it into tiers, price on value rather than hours, structure recurring revenue, and run a demo that closes.",
  readingMinutes: 9,
  order: 2,
  updatedAt: "2026-09-23",
  tags: ["pricing", "packaging", "sales", "positioning", "retainer", "demo"],
  body: [
    {
      type: "paragraph",
      text: "The companion to 'Positioning & Selling the Platform' answers the next question a buyer asks: what does it cost, and what do I get? Price the outcome, not the hours. The build already exists as reusable scaffolding, so your marginal cost per client is low — capture that as margin, not as a discount.",
    },
    {
      type: "heading",
      text: "Package into three tiers",
    },
    {
      type: "paragraph",
      text: "Tiers anchor the conversation and make the middle option feel obvious. Keep the cheapest deliberately lean so the recommended tier is the natural choice, and reserve custom integration work for the top tier where scope is genuinely open-ended.",
    },
    {
      type: "table",
      title: "Reference packaging",
      headers: ["Tier", "Who it's for", "Includes"],
      rows: [
        ["Launch", "A brand that needs to go live fast", "Storefront + docs, CMS seam ready, standard content types"],
        ["Growth", "Teams publishing daily", "Everything in Launch + custom content modelling, analytics, campaign email"],
        ["Scale", "Multi-market / integration-heavy", "Everything in Growth + bespoke integrations, SLAs, priority support"],
      ],
    },
    {
      type: "chart",
      chartType: "bar",
      title: "Figure 1 — Value captured vs delivery cost",
      caption: "Illustrative: because the scaffolding is reused, delivery cost stays flat while the value delivered scales with the tier.",
      unit: "k",
      xKey: "tier",
      data: [
        { tier: "Launch", value: 12, cost: 5 },
        { tier: "Growth", value: 28, cost: 8 },
        { tier: "Scale", value: 60, cost: 16 },
      ],
      series: [
        { key: "value", label: "Value to buyer", color: "var(--color-chart-2)" },
        { key: "cost", label: "Delivery cost", color: "var(--color-chart-4)" },
      ],
    },
    {
      type: "heading",
      text: "Price on value, not hours",
    },
    {
      type: "list",
      items: [
        "Anchor to what the buyer gains — faster publishing, better conversion, less rework — not to a day rate.",
        "Quote a fixed project price per tier so the buyer has cost certainty and you keep the upside of reuse.",
        "Never itemise the reused scaffolding as 'free'; it is the reason the price is defensible and the timeline short.",
      ],
    },
    {
      type: "heading",
      text: "Build in recurring revenue",
    },
    {
      type: "paragraph",
      text: "The one-off build is the entry point; the retainer is the business. Position ongoing work as protecting and growing the asset — the QA suite, content support, performance budgets, and the eventual CMS migration are natural retainer scope.",
    },
    {
      type: "steps",
      items: [
        { title: "Care plan", text: "Monthly retainer covering updates, monitoring, and small content/dev requests." },
        { title: "Content partnership", text: "Ongoing help modelling and publishing content as the brand's needs grow." },
        { title: "Roadmap block", text: "A committed monthly allocation for new features, billed as a predictable block." },
      ],
    },
    {
      type: "heading",
      text: "Run a demo that closes",
    },
    {
      type: "steps",
      items: [
        { title: "Open on the outcome", text: "Publish a content change live and show it appear without a rebuild — lead with 'publish daily, load instantly, never break.'" },
        { title: "Show the speed", text: "Load a page cold and let the near-instant render make the performance argument for you." },
        { title: "Show the safety", text: "Point at the contract tests and the CMS seam as the reason changes don't break the site." },
        { title: "Close on the retainer", text: "Frame the care plan as how the buyer keeps all of the above true over time." },
      ],
    },
    {
      type: "quote",
      text: "Sell the first build to win the relationship; sell the retainer to keep it.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The margin is in the reuse",
      text: "Every client reuses the same server-first architecture, CMS seam, and QA scaffolding. Your cost falls with each build while the buyer's value holds — that gap is your margin, and value-based pricing is how you keep it.",
    },
  ],
}
