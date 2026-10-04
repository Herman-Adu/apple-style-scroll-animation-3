import type { Doc } from "../lib/domain/schema"

export const roiAndCostOfOwnership: Doc = {
  slug: "roi-and-total-cost-of-ownership",
  title: "ROI & Total Cost of Ownership",
  category: "Business Case",
  audience: "cto",
  access: "public",
  summary:
    "The money case for the platform in the language a CTO signs off on: what it costs over three years versus a template or page builder, where the savings come from, and how fast it pays back.",
  readingMinutes: 9,
  order: 1,
  updatedAt: "2026-10-04",
  tags: ["roi", "tco", "cost", "business case", "budget", "cto"],
  body: [
    {
      type: "paragraph",
      text: "The sticker price of a website is the smallest number in the decision. What a CTO actually pays for is three years of change: every copy edit, every campaign, every new product, and the engineering hours each of those consumes. This guide models that total cost of ownership and shows where a server-first, CMS-decoupled build wins the budget back.",
    },
    {
      type: "callout",
      variant: "info",
      title: "How to read this",
      text: "The figures below are illustrative planning numbers, not a quote — they exist to frame the shape of the decision. Swap in your own blended day-rate and content cadence and the ranking holds.",
    },
    {
      type: "heading",
      text: "The three cost centers",
    },
    {
      type: "list",
      items: [
        "Build — the one-time cost to ship the first version. Templates win here and only here.",
        "Change — the recurring cost of keeping content and campaigns moving. This is where most of the three-year spend actually lives.",
        "Risk — the cost of a change that breaks the site: lost sales, emergency engineering, and the replatform that follows a build that could not keep up.",
      ],
    },
    {
      type: "table",
      title: "Illustrative three-year total cost of ownership",
      headers: ["Cost center", "Cheap template", "Page builder", "This platform"],
      rows: [
        ["Initial build", "Low", "Low", "Medium"],
        ["Editor / content time", "High (engineer in the loop)", "Medium (per-seat + limits)", "Low (editors self-serve)"],
        ["Platform / license fees", "Low", "High (per-page tax)", "Low"],
        ["Replatform risk", "High (rebuild within ~18mo)", "Medium (lock-in)", "Low (CMS is swappable)"],
        ["3-year direction", "Rises sharply", "Rises steadily", "Flattens"],
      ],
    },
    {
      type: "chart",
      chartType: "line",
      title: "Figure 1 — Cumulative cost of ownership over three years",
      caption: "Illustrative. The template's line bends upward as engineer-in-the-loop content work and an eventual rebuild accumulate; the platform's flattens as editors self-serve.",
      unit: "k",
      xKey: "period",
      data: [
        { period: "Launch", template: 12, builder: 18, platform: 24 },
        { period: "Year 1", template: 46, builder: 44, platform: 34 },
        { period: "Year 2", template: 84, builder: 70, platform: 42 },
        { period: "Year 3", template: 140, builder: 98, platform: 51 },
      ],
      series: [
        { key: "template", label: "Cheap template", color: "var(--color-chart-4)" },
        { key: "builder", label: "Page builder", color: "var(--color-chart-3)" },
        { key: "platform", label: "This platform", color: "var(--color-chart-2)" },
      ],
    },
    {
      type: "heading",
      text: "Where the savings come from",
    },
    {
      type: "list",
      items: [
        "Editors publish without a deploy — the CMS seam removes engineering from the daily content path entirely.",
        "Server-first rendering means fewer client bugs to chase and better Core Web Vitals, which lowers paid-acquisition cost and lifts organic reach.",
        "The typed domain model and QA suite make the next feature cheaper — you build on a contract, not on guesswork.",
        "No per-page platform tax and no vendor lock-in: the CMS is swappable by design, so you are never renegotiating from a weak position.",
      ],
    },
    {
      type: "heading",
      text: "The payback",
    },
    {
      type: "steps",
      items: [
        { title: "Quarter 1", text: "The editor-time saving alone typically covers the build premium over a template — content stops queuing behind engineering." },
        { title: "Year 1", text: "Faster pages compound into better SEO and lower cost-per-acquisition; the cumulative lines cross." },
        { title: "Year 2–3", text: "The template is heading toward a rebuild while this platform absorbs new features on the existing seam. The gap widens every quarter." },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "The one-line business case",
      text: "You are not buying a cheaper website — you are buying a flatter cost curve. The build costs a little more once; the change costs far less forever.",
    },
  ],
}
