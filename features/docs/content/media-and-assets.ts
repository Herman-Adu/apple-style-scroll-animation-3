import type { Doc } from "../schema"

export const mediaAndAssets: Doc = {
  slug: "media-and-assets",
  title: "Media & Assets",
  category: "Media Library",
  audience: "content",
  access: "admin",
  summary:
    "How imagery and files work across the store — where product photos and brand assets live, how the Strapi media library fits in, and the naming, sizing, and alt-text conventions that keep the site fast and accessible.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["admin", "media", "images", "assets", "strapi", "accessibility"],
  body: [
    {
      type: "paragraph",
      text: "Great product imagery does a lot of the selling. This guide explains where media lives today, how you reference it when editing products and content, and the conventions that keep pages quick to load and accessible to everyone.",
    },
    {
      type: "callout",
      variant: "note",
      text: "There isn't a separate upload dashboard in the app itself yet. Media is referenced by URL or path, and — when the CMS is connected — managed in Strapi's media library. This guide describes that model and the standards to follow.",
    },
    {
      type: "heading",
      text: "Where media lives",
    },
    {
      type: "table",
      title: "Asset locations",
      headers: ["Source", "Used for", "How it's referenced"],
      rows: [
        ["Project public folder", "Built-in brand assets and static imagery shipped with the app.", "A root-relative path such as /images/hero.png."],
        ["Strapi media library", "Product and content imagery managed by editors when the CMS is connected.", "A full URL returned by the CMS on each record."],
        ["External URL", "Anything hosted elsewhere (a CDN, for example).", "The absolute https URL."],
      ],
    },
    {
      type: "paragraph",
      text: "Product records carry image references rather than the image bytes themselves. Whether an image comes from the public folder, Strapi, or an external CDN, the storefront just renders the URL it's given — so you can move an asset's home without touching the components.",
    },
    {
      type: "heading",
      text: "The Strapi media library",
    },
    {
      type: "paragraph",
      text: "When Strapi is connected as the CMS, its media library is the place editors upload, organise, and reuse imagery. An image uploaded once can be attached to any product or article, and a change there flows to the storefront through the same publishing pipeline as the rest of your content.",
    },
    {
      type: "list",
      items: [
        "Upload in Strapi, then attach the asset to a product or article field.",
        "Reuse a single upload across many records instead of re-uploading.",
        "Publishing a record that references the image makes it live via the revalidation webhook.",
      ],
    },
    {
      type: "callout",
      variant: "info",
      text: "Publishing an image-bearing record triggers the same instant cache revalidation covered in 'CMS & Publishing' — new or swapped imagery appears without a redeploy.",
    },
    {
      type: "heading",
      text: "Naming & organisation",
    },
    {
      type: "list",
      items: [
        "Use lowercase, hyphenated names that describe the subject: momo-anc-pro-front.png, not IMG_2043.png.",
        "Keep one clear primary image per product, plus consistent supporting angles.",
        "Group by product or campaign so assets are easy to find and reuse.",
      ],
    },
    {
      type: "heading",
      text: "Sizing & format",
    },
    {
      type: "paragraph",
      text: "Ship images at roughly the size they'll display (at up to 2× for sharpness on high-density screens) rather than uploading enormous originals. Right-sized files keep the store fast, which directly helps conversion and SEO.",
    },
    {
      type: "table",
      title: "Format guidance",
      headers: ["Format", "Best for"],
      rows: [
        ["WebP / AVIF", "Photographic product imagery — excellent quality at small file sizes."],
        ["PNG", "Logos and graphics that need transparency or crisp edges."],
        ["SVG", "Icons and simple vector marks that must stay sharp at any size."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      text: "Before uploading a hero or product shot, compress it. A page full of multi-megabyte images is the most common cause of a slow storefront.",
    },
    {
      type: "heading",
      text: "Alt text & accessibility",
    },
    {
      type: "paragraph",
      text: "Every meaningful image needs descriptive alt text — it's read aloud by screen readers, shown if an image fails to load, and used by search engines. Describe the subject, not the file: \"MOMO ANC Pro headphones in midnight black, three-quarter view\" beats \"product image\".",
    },
    {
      type: "callout",
      variant: "warning",
      text: "Purely decorative images should have empty alt text so screen readers skip them — but anything that carries meaning or is part of the product story must be described.",
    },
    {
      type: "callout",
      variant: "info",
      text: "As the store moves fully server-side, a first-party upload surface backed by managed storage can slot in behind these same conventions — records will keep referencing a URL exactly as they do now.",
    },
  ],
}
