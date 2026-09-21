import type { Doc } from "../schema"

export const serverFirstPlaybook: Doc = {
  slug: "server-first-rendering-playbook",
  title: "The Server-First Rendering Playbook",
  category: "Next.js",
  summary:
    "How this codebase decides between Server Components and client islands, how streaming works, and the rules that keep the client bundle small.",
  readingMinutes: 11,
  order: 1,
  updatedAt: "2026-09-15",
  tags: ["rsc", "streaming", "suspense", "client islands", "performance"],
  body: [
    {
      type: "paragraph",
      text: "Next.js App Router is server-first by default: every component is a React Server Component (RSC) unless you explicitly opt into the client with a \"use client\" directive. This app treats that default as a discipline, not an accident. Pages fetch data on the server, render HTML there, and ship interactivity only as small leaf islands. This guide is the decision framework we actually follow.",
    },
    {
      type: "heading",
      text: "The mental model",
    },
    {
      type: "paragraph",
      text: "Think of a page as a mostly-static server-rendered tree with a few interactive islands embedded in it. The server tree is free — it costs zero client JavaScript. Each island you add ships its component code, its dependencies, and the React runtime needed to hydrate it. So the question is never \"should this be a client component?\" but \"what is the smallest possible island that delivers this interaction?\"",
    },
    {
      type: "mermaid",
      kind: "architecture",
      title: "Figure 1 — Server tree with client islands",
      caption: "The page and layout stay on the server; only the leaf islands hydrate on the client.",
      diagram: `graph TD
    A["RootLayout (RSC)"] --> B["Page (RSC)"]
    B --> C["ProductShowcase (RSC)"]
    B --> D["BrandStatement (RSC)"]
    C --> E["ProductCard (RSC)"]
    E --> F["Reveal (client island)"]
    B --> G["SearchField (client island)"]
    A --> H["SiteHeader (RSC)"]
    H --> I["CartButton (client island)"]
    classDef server fill:#0a0a0a,stroke:#2a2a2a,color:#e5e5e5;
    classDef client fill:#0a1a1a,stroke:#4db8b8,color:#7fe0e0;
    class A,B,C,D,E,H server;
    class F,G,I client;`,
    },
    {
      type: "heading",
      text: "When to reach for a client component",
    },
    {
      type: "paragraph",
      text: "There are only a handful of legitimate reasons to cross the client boundary. If none of these apply, the component stays on the server.",
    },
    {
      type: "list",
      items: [
        "It uses state or lifecycle: useState, useReducer, useEffect, useRef against the DOM.",
        "It handles browser events: onClick, onChange, onScroll, pointer/drag handlers.",
        "It reads browser-only APIs: window, localStorage, matchMedia, IntersectionObserver.",
        "It uses a library that itself depends on those things (framer-motion, recharts, mermaid).",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Push the boundary to the leaf",
      text: "A presentational card that only needs an entrance animation should not be a client component. Wrap the animated part in a tiny client island (our <Reveal>) and keep the card itself on the server. We audited and converted four cards this way — the grids stayed RSC and the client bundle shrank.",
    },
    {
      type: "heading",
      text: "Streaming with Suspense",
    },
    {
      type: "paragraph",
      text: "Server-first does not mean slow-first. Every list and detail page wraps its data-fetching subtree in <Suspense> with a skeleton fallback. Next.js streams the shell immediately, then flushes each section's HTML as its data resolves. The user sees layout and skeletons on the first byte, and content fills in without a spinner-blocked page.",
    },
    {
      type: "mermaid",
      kind: "sequence",
      title: "Figure 2 — Streaming a page with Suspense",
      caption: "The shell streams first; the slow data section flushes when ready.",
      diagram: `sequenceDiagram
    participant U as Browser
    participant S as Next.js Server
    participant C as CMS / Data
    U->>S: GET /products
    S-->>U: Shell + skeletons (first byte)
    S->>C: fetch products
    C-->>S: product data
    S-->>U: Stream product grid HTML
    Note over U: Skeleton swaps to content<br/>no full-page spinner`,
    },
    {
      type: "code",
      language: "tsx",
      title: "app/products/page.tsx — the pattern",
      code: `export default async function ProductsPage({ searchParams }) {
  const { q } = await searchParams
  return (
    <main>
      <PageHero title="Products" />
      <SearchField placeholder="Search products" />
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid query={q} />
      </Suspense>
    </main>
  )
}

// Server Component — fetches on the server, ships no JS.
async function ProductGrid({ query }: { query?: string }) {
  const products = filterProducts(await fetchProducts(), query)
  return <div className="grid ...">{products.map((p) => <ProductCard ... />)}</div>
}`,
    },
    {
      type: "heading",
      text: "Filtering and search stay on the server",
    },
    {
      type: "paragraph",
      text: "Search is a good stress test of the discipline. The naive approach makes the whole list a client component, ships all data to the browser, and filters in JavaScript. We do the opposite: a tiny SearchField island writes the query to the URL (?q=), the Server Component reads that param, filters server-side with a pure helper, and streams the result. The only client JavaScript is a debounced input.",
    },
    {
      type: "chart",
      chartType: "bar",
      title: "Figure 3 — Client JS shipped per approach",
      caption: "Approximate client bundle for the products list. Server-first ships only the input island.",
      unit: "KB",
      xKey: "approach",
      data: [
        { approach: "All-client list", js: 48 },
        { approach: "Client + memo", js: 39 },
        { approach: "Server-first (ours)", js: 6 },
      ],
      series: [{ key: "js", label: "Client JS", color: "var(--color-chart-2)" }],
    },
    {
      type: "heading",
      text: "The rules we hold ourselves to",
    },
    {
      type: "steps",
      items: [
        { title: "Default to server", text: "New components have no directive. Add \"use client\" only when a rule above forces it." },
        { title: "Fetch on the server", text: "Data is fetched in async Server Components or passed down as props. Never fetch inside useEffect." },
        { title: "Islands are leaves", text: "A client component should not have large server subtrees as children by value — pass them as children props so they stay server-rendered." },
        { title: "Wrap slow data in Suspense", text: "Every await that could be slow lives behind a Suspense boundary with a skeleton." },
        { title: "Keep state in the URL", text: "Filters, tabs, and pagination live in searchParams so they are shareable, server-readable, and need no client store." },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "The children-prop trap",
      text: "A client component can render server components — but only if they are passed as props/children, not imported and used directly inside it. Importing a server component into a client file silently turns it into a client component and pulls its whole subtree across the boundary.",
    },
    {
      type: "quote",
      text: "The cheapest component is the one that never ships to the browser.",
    },
  ],
}
