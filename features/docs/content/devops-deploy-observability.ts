import type { Doc } from "../schema"

export const devopsDeployObservability: Doc = {
  slug: "devops-deploy-cache-observability",
  title: "Deploy, Cache & Observability",
  category: "DevOps",
  summary:
    "The delivery pipeline: CI gates, preview deploys, the caching layers from ISR to cache tags, and what to watch in production.",
  readingMinutes: 12,
  order: 1,
  updatedAt: "2026-09-16",
  tags: ["ci", "vercel", "isr", "caching", "observability", "web vitals"],
  body: [
    {
      type: "paragraph",
      text: "Shipping this app safely rests on three things: a CI gate that runs the QA suite on every change, a preview deploy for every branch, and a caching model that serves fast pages while keeping content fresh. This guide covers all three and the signals to watch once it is live.",
    },
    {
      type: "heading",
      text: "The delivery pipeline",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — Commit to production",
      caption: "Every push runs unit + integration; PRs add browser E2E. Only green merges reach production.",
      diagram: `flowchart LR
    A["git push"] --> B{"CI: lint +<br/>unit + integration"}
    B -->|fail| X["Block merge"]
    B -->|pass| C["Preview deploy"]
    C --> D{"PR: Playwright<br/>E2E + SEO"}
    D -->|fail| X
    D -->|pass| E["Merge to main"]
    E --> F["Production deploy"]
    F --> G["Post-deploy smoke"]
    classDef ok fill:#0a1a1a,stroke:#4db8b8,color:#7fe0e0;
    classDef bad fill:#1a0a0a,stroke:#b84d4d,color:#e07f7f;
    class C,E,F,G ok;
    class X bad;`,
    },
    {
      type: "code",
      language: "yaml",
      title: ".github/workflows/ci.yml — the gate",
      code: `name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test          # unit + integration (vitest)
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e      # browser specs
`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Tests that do not run are decorative",
      text: "The QA suite already exists in qa/. The value comes from wiring it into CI so the mapper contract tests fire the day someone changes a content shape. Add a pre-commit hook (lint-staged) for fast local feedback on top of the CI gate.",
    },
    {
      type: "heading",
      text: "The caching layers",
    },
    {
      type: "paragraph",
      text: "Requests pass through several caches. Understanding which layer serves a response tells you where to invalidate when content changes. Static and ISR pages are served from the edge; dynamic data is tagged so it can be surgically revalidated.",
    },
    {
      type: "table",
      title: "Where a response can come from",
      headers: ["Layer", "Serves", "Invalidated by"],
      rows: [
        ["Static (SSG)", "Fully static routes", "New deploy"],
        ["ISR / cached fetch", "Data-backed pages", "revalidateTag / time"],
        ["Data cache (tags)", "fetchStrapi results", "Webhook -> revalidateTag"],
        ["Edge CDN", "All of the above", "Automatic on revalidate"],
      ],
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 2 — Request cache resolution",
      caption: "A request is served from the first warm layer; a miss falls through to origin and repopulates.",
      diagram: `flowchart TD
    R["Request"] --> CDN{"Edge CDN hit?"}
    CDN -->|yes| Serve["Serve cached"]
    CDN -->|no| DC{"Data cache<br/>tag warm?"}
    DC -->|yes| Render["Render + cache"]
    DC -->|no| Origin["Fetch Strapi<br/>+ tag result"]
    Origin --> Render
    Render --> Serve`,
    },
    {
      type: "heading",
      text: "Observability",
    },
    {
      type: "paragraph",
      text: "Once live, watch three signal families: delivery health (error rate, function duration), content freshness (revalidation success), and experience (Core Web Vitals). Vercel Analytics and Speed Insights cover experience; a Sentry wrap around the fetchStrapi boundary surfaces CMS failures before users report them.",
    },
    {
      type: "chart",
      chartType: "line",
      title: "Figure 3 — Core Web Vitals targets",
      caption: "Illustrative LCP across routes against the 2.5s 'good' threshold.",
      unit: "s",
      xKey: "route",
      data: [
        { route: "/", lcp: 1.2, target: 2.5 },
        { route: "/products", lcp: 1.6, target: 2.5 },
        { route: "/products/[slug]", lcp: 1.4, target: 2.5 },
        { route: "/articles", lcp: 1.5, target: 2.5 },
        { route: "/docs", lcp: 1.3, target: 2.5 },
      ],
      series: [
        { key: "lcp", label: "LCP", color: "var(--color-chart-2)" },
        { key: "target", label: "Good threshold", color: "var(--color-chart-4)" },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Guard the CMS boundary",
      text: "A slow or failing Strapi should degrade gracefully, not take down the page. Wrap fetchStrapi with a timeout and a typed error, render a boundary fallback, and alert on the error — never leak a raw 500 to the visitor.",
    },
  ],
}
