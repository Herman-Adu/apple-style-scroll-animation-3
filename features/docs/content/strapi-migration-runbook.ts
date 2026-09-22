import type { Doc } from "../schema"

export const strapiMigrationRunbook: Doc = {
  slug: "strapi-migration-runbook",
  title: "Strapi Migration Runbook",
  category: "Migration",
  audience: "developer",
  access: "admin",
  summary:
    "The end-to-end plan for swapping local content for a live Strapi instance: the data seam, cache tags, webhook revalidation, and the go-live checklist.",
  readingMinutes: 14,
  order: 1,
  updatedAt: "2026-09-18",
  tags: ["strapi", "cms", "revalidation", "webhooks", "isr", "seam"],
  body: [
    {
      type: "paragraph",
      text: "The app was built so that switching from local content to Strapi is a configuration change, not a rewrite. Every feature reads through an API seam that returns typed domain objects. Today those functions read from local TypeScript; tomorrow they read from Strapi through a mapper. The UI never knows the difference. This runbook is the exact sequence to make that switch safely.",
    },
    {
      type: "heading",
      text: "The seam architecture",
    },
    {
      type: "paragraph",
      text: "Each feature (products, articles, docs) exposes an api/ module. Pages call those functions and receive domain types. Behind the function is either the local content module (now) or a fetchStrapi call plus a mapper (after migration). The mapper is the single place the Strapi payload shape is allowed to exist — it translates raw CMS JSON into the domain type the rest of the app already consumes.",
    },
    {
      type: "mermaid",
      kind: "architecture",
      title: "Figure 1 — The data seam",
      caption: "Only the api/ + mapper layer changes. Pages and components are untouched.",
      diagram: `graph LR
    subgraph UI["UI layer (unchanged)"]
      P["Page / RSC"] --> API["features/*/api"]
    end
    subgraph SEAM["Seam (swap here)"]
      API --> LOCAL["local content (now)"]
      API --> STRAPI["fetchStrapi + mapper (after)"]
    end
    STRAPI --> CMS[("Strapi CMS")]
    classDef a fill:#0a0a0a,stroke:#2a2a2a,color:#e5e5e5;
    classDef b fill:#0a1a1a,stroke:#4db8b8,color:#7fe0e0;
    class P,API,LOCAL a;
    class STRAPI,CMS b;`,
    },
    {
      type: "code",
      language: "typescript",
      title: "features/products/api/index.ts — swapping the source",
      code: `// BEFORE — local content
export async function fetchProducts(): Promise<Product[]> {
  return getAllProducts()
}

// AFTER — Strapi through the mapper, cache-tagged
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetchStrapi("/api/products?populate=*", {
    next: { tags: [tags.products.all()] },
  })
  return res.data.map(mapStrapiProduct) // <- only the mapper knows CMS shape
}`,
    },
    {
      type: "heading",
      text: "Cache tags and revalidation",
    },
    {
      type: "paragraph",
      text: "Every fetch is tagged. A product list is tagged products:all; a single product is tagged product:<slug>. When an editor publishes in Strapi, a webhook hits our revalidate route, which calls revalidateTag for exactly the tags that changed. Next.js then regenerates only those cached entries — no full rebuild, no stale pages.",
    },
    {
      type: "table",
      title: "Cache tag taxonomy",
      headers: ["Content", "List tag", "Entry tag"],
      rows: [
        ["Products", "products:all", "product:<slug>"],
        ["Articles", "articles:all", "article:<slug>"],
        ["Docs", "docs:all", "doc:<slug>"],
        ["Global (nav, settings)", "global:site", "—"],
      ],
    },
    {
      type: "mermaid",
      kind: "sequence",
      title: "Figure 2 — Publish-to-live revalidation",
      caption: "An editor publishing in Strapi invalidates only the affected cache tags.",
      diagram: `sequenceDiagram
    participant E as Editor
    participant St as Strapi
    participant W as /api/revalidate
    participant N as Next.js Cache
    participant V as Visitor
    E->>St: Publish "Momo X" product
    St->>W: POST webhook (secret, model, entry)
    W->>W: Verify STRAPI_WEBHOOK_SECRET
    W->>N: revalidateTag("products:all")
    W->>N: revalidateTag("product:momo-x")
    N-->>W: 200 ok
    V->>N: GET /products/momo-x
    N-->>V: Freshly regenerated page`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Verify the webhook secret",
      text: "The revalidate route must reject any request whose secret does not match STRAPI_WEBHOOK_SECRET. Without it, anyone could force cache invalidation. The route returns 401 on mismatch and 404 while the secret is unset.",
    },
    {
      type: "heading",
      text: "The mapper contract",
    },
    {
      type: "paragraph",
      text: "Mappers are pure functions from raw Strapi entries to domain types, and they are covered by contract tests. The tests feed a recorded Strapi payload fixture into the mapper and assert the domain object matches. This is what lets you change Strapi's response shape and catch the break in CI before it reaches a page.",
    },
    {
      type: "code",
      language: "typescript",
      title: "features/products/mappers.ts",
      code: `import type { Product } from "./schema"

export function mapStrapiProduct(entry: StrapiProductEntry): Product {
  const a = entry.attributes
  return {
    slug: a.slug,
    name: a.name,
    price: a.price,
    category: a.category,
    summary: a.summary,
    image: a.cover?.data?.attributes?.url ?? "/placeholder.svg",
    features: a.features?.map((f) => ({ title: f.title, text: f.text })) ?? [],
  }
}`,
    },
    {
      type: "heading",
      text: "Go-live checklist",
    },
    {
      type: "steps",
      items: [
        { title: "Provision Strapi", text: "Stand up the instance, create the content types (see the Content Modeling guide), and seed the current local content." },
        { title: "Set environment variables", text: "STRAPI_API_URL, STRAPI_API_TOKEN, STRAPI_WEBHOOK_SECRET, and NEXT_PUBLIC_SITE_URL in the Vercel project." },
        { title: "Flip the api/ functions", text: "Swap each fetch* to call fetchStrapi + mapper. The mapper contract tests must stay green." },
        { title: "Wire the webhook", text: "In Strapi, point a publish/unpublish webhook at /api/revalidate with the shared secret." },
        { title: "Verify against a mock first", text: "Run the app against a mock Strapi (MSW) using recorded fixtures to exercise the real code path before the instance is live." },
        { title: "Smoke test in preview", text: "Deploy to a preview, publish a test edit, and confirm only the affected pages regenerate." },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "Rollback is trivial",
      text: "Because the seam is a single layer, rolling back is reverting the api/ functions to the local source. Keep the local content modules until Strapi has been stable in production for a full content cycle.",
    },
  ],
}
