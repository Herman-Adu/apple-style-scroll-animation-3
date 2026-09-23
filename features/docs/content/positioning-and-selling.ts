import type { Doc } from "../schema"

export const positioningAndSelling: Doc = {
  slug: "positioning-and-selling-the-platform",
  title: "Positioning & Selling the Platform",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "How to frame this stack to a buyer: the market it fits, the value it delivers over a template, and the objections to answer before they are raised.",
  readingMinutes: 10,
  order: 1,
  updatedAt: "2026-09-19",
  tags: ["market", "value proposition", "sales", "positioning", "roi"],
  body: [
    {
      type: "paragraph",
      text: "A technically excellent build does not sell itself. This guide translates the architecture into buyer language: who it is for, what it replaces, and why the server-first + CMS-seam approach is worth more than a cheaper template. Use it to brief sales, write a proposal, or anchor a pitch.",
    },
    {
      type: "heading",
      text: "Who this is for",
    },
    {
      type: "paragraph",
      text: "The sweet spot is a brand that lives or dies by content and speed: premium retail, editorial commerce, and product-led marketing sites where a marketing team must ship changes without an engineer, and where page speed is a revenue lever, not a vanity metric.",
    },
    {
      type: "list",
      items: [
        "Premium / considered-purchase retail where storytelling drives conversion.",
        "Editorial commerce blending articles and product in one journey.",
        "Marketing teams that need to publish daily without a deploy.",
        "Brands where Core Web Vitals directly affect ad spend efficiency and SEO.",
      ],
    },
    {
      type: "heading",
      text: "The value proposition",
    },
    {
      type: "paragraph",
      text: "Three durable advantages: editors move fast because content is decoupled through the CMS seam; visitors get near-instant pages because rendering is server-first; and the business de-risks change because the QA suite and the seam make swaps safe. Frame each as an outcome, not a feature.",
    },
    {
      type: "table",
      title: "Feature to outcome translation",
      headers: ["What we built", "What the buyer gets"],
      rows: [
        ["Server-first rendering", "Faster pages, better SEO, lower bounce"],
        ["CMS seam + mappers", "Editors publish without engineering"],
        ["Cache-tag revalidation", "Fresh content with no rebuilds or downtime"],
        ["QA suite + contract tests", "Changes ship without breaking the site"],
        ["Typed domain model", "Cheaper future features, less rework"],
      ],
    },
    {
      type: "chart",
      chartType: "bar",
      title: "Figure 1 — Time to publish a content change",
      caption: "Illustrative editor turnaround: template-with-engineer vs this CMS-backed stack.",
      unit: "hrs",
      xKey: "task",
      data: [
        { task: "Copy edit", template: 4, ours: 0.1 },
        { task: "New article", template: 8, ours: 0.5 },
        { task: "New product", template: 6, ours: 0.4 },
        { task: "Homepage swap", template: 12, ours: 1 },
      ],
      series: [
        { key: "template", label: "Template + engineer", color: "var(--color-chart-4)" },
        { key: "ours", label: "This platform", color: "var(--color-chart-2)" },
      ],
    },
    {
      type: "heading",
      text: "Positioning against the alternatives",
    },
    {
      type: "list",
      items: [
        "Versus a cheap template: templates are client-heavy and hard-code content — they get slower and more brittle as the brand grows.",
        "Versus a full custom build: we deliver the same rigor at a fraction of the timeline because the seam and QA scaffolding already exist.",
        "Versus a page builder / all-in-one: no per-page platform tax, full control of performance, and no lock-in — the CMS is swappable by design.",
      ],
    },
    {
      type: "quote",
      text: "You are not buying a website. You are buying the ability to change it every day without breaking it.",
    },
    {
      type: "heading",
      text: "Objection handling",
    },
    {
      type: "steps",
      items: [
        { title: "\"It costs more than a template.\"", text: "The editor time saved pays it back in the first quarter — and a template that cannot keep up gets rebuilt within a year." },
        { title: "\"We already have a CMS.\"", text: "Good — the seam is CMS-agnostic. We map to what you have; you keep your editorial workflow." },
        { title: "\"How do we know it will not break?\"", text: "Every content shape is covered by contract tests that run in CI. A breaking change is caught before it ships, not after." },
        { title: "\"Can our team maintain it?\"", text: "The conventions are documented in this library, the model is typed end to end, and the patterns repeat — onboarding is days, not weeks." },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "Lead with the outcome",
      text: "In a pitch, open with 'publish daily, load instantly, never break' and let the architecture be the proof — not the headline. Buyers buy outcomes; engineers verify mechanisms.",
    },
  ],
}
