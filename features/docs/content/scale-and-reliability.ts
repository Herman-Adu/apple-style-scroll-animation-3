import type { Doc } from "../schema"

export const scaleAndReliability: Doc = {
  slug: "scale-performance-and-reliability",
  title: "Scale, Performance & Reliability",
  category: "Technology Strategy",
  audience: "cto",
  access: "public",
  summary:
    "How the platform holds up under load and traffic spikes: serverless autoscaling, edge delivery, cache-tag revalidation, and the performance budget that keeps Core Web Vitals green as the catalog and traffic grow.",
  readingMinutes: 7,
  order: 2,
  updatedAt: "2026-09-28",
  tags: ["scale", "performance", "reliability", "core web vitals", "caching", "cto"],
  body: [
    {
      type: "paragraph",
      text: "A launch that is fast for the founder and slow on Black Friday is a failed launch. This platform is built so that performance is a property of the architecture, not a heroic effort applied later. Here is how it stays fast and available as the catalog and the traffic grow.",
    },
    {
      type: "heading",
      text: "Scaling is the platform's job, not yours",
    },
    {
      type: "list",
      items: [
        "Compute scales per-request and to zero: a traffic spike spins up capacity automatically, and a quiet night costs nothing.",
        "Neon Postgres autoscales and scales to zero too, so the database matches demand instead of being sized for the worst case all month.",
        "Static and cached responses are served from the edge, close to the visitor, so latency is a function of geography solved — not server load.",
      ],
    },
    {
      type: "heading",
      text: "Fresh content without rebuilds",
    },
    {
      type: "paragraph",
      text: "Pages are cached aggressively and revalidated by cache tag, so a content change invalidates exactly what it touched and nothing else. Editors see updates promptly, visitors get cache-fast pages, and there is no full-site rebuild or deploy in the loop. Freshness and speed stop being a trade-off.",
    },
    {
      type: "chart",
      chartType: "bar",
      title: "Figure 1 — Response profile as traffic scales",
      caption: "Illustrative. Server-first + edge caching keeps time-to-content flat as concurrent traffic rises, where a client-heavy build degrades.",
      unit: "ms",
      xKey: "load",
      data: [
        { load: "Baseline", clientHeavy: 1400, serverFirst: 600 },
        { load: "10x traffic", clientHeavy: 2600, serverFirst: 680 },
        { load: "50x spike", clientHeavy: 4800, serverFirst: 760 },
      ],
      series: [
        { key: "clientHeavy", label: "Client-heavy build", color: "var(--color-chart-4)" },
        { key: "serverFirst", label: "This platform", color: "var(--color-chart-2)" },
      ],
    },
    {
      type: "heading",
      text: "The performance budget",
    },
    {
      type: "paragraph",
      text: "Core Web Vitals are treated as a budget, not an afterthought. Server-first rendering keeps Largest Contentful Paint low, minimal client JavaScript protects Interaction to Next Paint, and reserved media dimensions hold Cumulative Layout Shift near zero. The budget is a design constraint every new feature is held to.",
    },
    {
      type: "callout",
      variant: "success",
      title: "Reliability is structural",
      text: "There is no single box to fall over: compute and database autoscale independently, the edge absorbs read traffic, and cache-tag revalidation means a busy sale never triggers a risky full rebuild. The system is fast because it is shaped to be — and it stays fast under load for the same reason.",
    },
  ],
}
