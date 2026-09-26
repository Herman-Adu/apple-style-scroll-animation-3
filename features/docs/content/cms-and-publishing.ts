import type { Doc } from "../schema"

export const cmsAndPublishing: Doc = {
  slug: "cms-and-publishing",
  title: "CMS & Publishing",
  category: "CMS & Publishing",
  audience: "content",
  access: "admin",
  summary:
    "How content moves from draft to live — the Strapi-backed publishing model, the fallback that keeps the site working without a CMS, and the webhook that makes a publish appear instantly with no redeploy.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["admin", "cms", "strapi", "publishing", "revalidation", "webhook"],
  body: [
    {
      type: "paragraph",
      text: "Content on the store — products, articles, and these docs — can be authored in code or managed in a headless CMS. This guide explains how the two modes work together, and how a publish becomes visible on the live site within seconds.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Strapi is the CMS this app is wired for. When it's connected, editors work in Strapi; when it isn't, the app falls back to built-in content so the site always renders.",
    },
    {
      type: "heading",
      text: "Two sources, one site",
    },
    {
      type: "paragraph",
      text: "Every content read goes through a single data layer that prefers the CMS and falls back to bundled content. That means the same page code works whether or not Strapi is connected — you can develop against local content and switch on the CMS later without rewrites.",
    },
    {
      type: "table",
      title: "Content modes",
      headers: ["Mode", "When it's used", "Source of truth"],
      rows: [
        ["CMS-backed", "Strapi is connected and reachable.", "Records published in Strapi."],
        ["Fallback", "No CMS configured, or it's unreachable.", "Content bundled with the app."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      text: "The fallback isn't just a safety net — it's how the site stays fully functional in local development and previews without needing CMS credentials.",
    },
    {
      type: "heading",
      text: "The publishing flow",
    },
    {
      type: "steps",
      items: [
        {
          title: "Author in Strapi",
          text: "Create or edit the record — a product, article, or doc — and fill in its fields and media.",
        },
        {
          title: "Publish",
          text: "Publishing in Strapi marks the record live and fires a webhook to the store.",
        },
        {
          title: "Revalidate",
          text: "The store receives the webhook and refreshes exactly the affected content, so the change appears within seconds.",
        },
      ],
    },
    {
      type: "heading",
      text: "Instant revalidation",
    },
    {
      type: "paragraph",
      text: "Pages are cached for speed, but caching normally means edits wait for the next rebuild. A verified webhook removes that wait: when you publish, Strapi calls the store's revalidate endpoint, which clears the cache tags for just that item.",
    },
    {
      type: "paragraph",
      text: "Reads are tagged granularly — a single doc is tagged both with a collection tag and its own per-slug tag (for example doc:managing-customers). So publishing one doc refreshes that doc without dumping the entire cache, keeping the rest of the site fast.",
    },
    {
      type: "table",
      title: "What gets revalidated",
      headers: ["You publish", "Tags refreshed"],
      rows: [
        ["A single doc", "The docs collection plus that doc's per-slug tag."],
        ["A product", "The product collection plus that product's entry."],
        ["An article", "The articles collection plus that article's entry."],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "The webhook is authenticated",
      text: "The revalidate endpoint verifies a shared secret before acting, so only Strapi can trigger a refresh. If publishes aren't going live, a mismatched or missing secret is the first thing to check.",
    },
    {
      type: "callout",
      variant: "info",
      text: "Because revalidation is scoped per item, there's no redeploy in the loop. Editors publish in Strapi and see the result on the live store almost immediately — the core benefit of owning the pipeline end to end.",
    },
    {
      type: "heading",
      text: "Troubleshooting",
    },
    {
      type: "list",
      items: [
        "A publish isn't showing — confirm the record is Published in Strapi, not just saved as a draft.",
        "Nothing refreshes at all — check the webhook's shared secret matches on both sides.",
        "Only some content is stale — verify the model is mapped to cache tags; an unmapped model returns 'no tags' and won't revalidate.",
        "CMS is down — the site keeps serving the last-known and fallback content, so visitors are never blocked.",
      ],
    },
  ],
}
