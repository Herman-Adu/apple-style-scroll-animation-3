import type { Doc } from "../schema"

export const strapiContentModeling: Doc = {
  slug: "strapi-content-modeling",
  title: "Content Modeling in Strapi: Schemas & Components",
  category: "Migration",
  audience: "developer",
  access: "admin",
  summary:
    "The exact Strapi content types, components, and dynamic zones that back this app — with schema JSON you can paste into a fresh instance.",
  readingMinutes: 13,
  order: 2,
  updatedAt: "2026-09-18",
  tags: ["strapi", "content-types", "components", "dynamic-zone", "schema"],
  body: [
    {
      type: "paragraph",
      text: "This guide maps every domain type in the app to a concrete Strapi content type. The goal is that the mapper (see the Migration Runbook) is a near 1:1 translation, so we model Strapi to match the domain shape rather than forcing the app to bend to Strapi defaults.",
    },
    {
      type: "heading",
      text: "The content graph",
    },
    {
      type: "mermaid",
      kind: "er",
      title: "Figure 1 — Content type relationships",
      caption: "Collection types, their components, and the shared Author relation.",
      diagram: `erDiagram
    PRODUCT ||--o{ FEATURE : has
    PRODUCT }o--|| CATEGORY : "enum"
    ARTICLE ||--o{ CONTENT_BLOCK : "dynamic zone"
    ARTICLE }o--|| AUTHOR : "written by"
    DOC ||--o{ DOC_BLOCK : "dynamic zone"
    PRODUCT {
      string slug PK
      string name
      decimal price
      enum category
      text summary
      media cover
    }
    ARTICLE {
      string slug PK
      string title
      text excerpt
      datetime publishedAt
      media coverImage
    }
    AUTHOR {
      string name
      string role
    }
    DOC {
      string slug PK
      string title
      enum category
      integer readingMinutes
    }`,
    },
    {
      type: "heading",
      text: "Collection type: Product",
    },
    {
      type: "paragraph",
      text: "Products are a collection type with a repeatable Feature component. The slug is the API id we key on. Category is an enumeration so it stays a closed set the UI can rely on for filtering.",
    },
    {
      type: "code",
      language: "json",
      title: "src/api/product/content-types/product/schema.json",
      code: `{
  "kind": "collectionType",
  "collectionName": "products",
  "info": { "singularName": "product", "pluralName": "products", "displayName": "Product" },
  "options": { "draftAndPublish": true },
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "price": { "type": "decimal", "required": true },
    "category": { "type": "enumeration", "enum": ["Headphones", "Earbuds", "Speakers"], "required": true },
    "summary": { "type": "text", "required": true },
    "cover": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "features": { "type": "component", "repeatable": true, "component": "product.feature" }
  }
}`,
    },
    {
      type: "code",
      language: "json",
      title: "src/components/product/feature.json",
      code: `{
  "collectionName": "components_product_features",
  "info": { "displayName": "Feature", "icon": "bulletList" },
  "attributes": {
    "title": { "type": "string", "required": true },
    "text": { "type": "text", "required": true }
  }
}`,
    },
    {
      type: "heading",
      text: "Collection type: Article with a dynamic zone",
    },
    {
      type: "paragraph",
      text: "Article bodies are a dynamic zone — an ordered list of heterogeneous blocks. This is the Strapi feature that maps directly onto our ArticleBlock union. Each block type becomes a component; the mapper switches on __component to build the typed block.",
    },
    {
      type: "code",
      language: "json",
      title: "Article body — dynamic zone definition",
      code: `"body": {
  "type": "dynamiczone",
  "components": [
    "content.heading",
    "content.paragraph",
    "content.quote"
  ]
}`,
    },
    {
      type: "code",
      language: "typescript",
      title: "Mapping a dynamic zone to the block union",
      code: `function mapBlock(block: StrapiComponent): ArticleBlock {
  switch (block.__component) {
    case "content.heading":   return { type: "heading", text: block.text }
    case "content.quote":     return { type: "quote", text: block.text, attribution: block.attribution }
    case "content.paragraph":
    default:                  return { type: "paragraph", text: block.text }
  }
}`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Model the docs blocks the same way",
      text: "The docs library you are reading uses a richer block union (code, callout, mermaid, chart, table, steps). Each maps to its own dynamic-zone component, so editors compose guides visually and the renderer stays identical.",
    },
    {
      type: "heading",
      text: "Populate strategy",
    },
    {
      type: "paragraph",
      text: "Strapi does not return relations, media, or components by default — you must populate them. For nested dynamic zones use the populate deep pattern or an explicit populate object so the mapper always receives a complete entry.",
    },
    {
      type: "code",
      language: "typescript",
      title: "Explicit populate for a full article",
      code: `const query = qs.stringify({
  populate: {
    coverImage: true,
    author: { fields: ["name", "role"] },
    body: { populate: "*" }, // hydrate every dynamic-zone component
  },
})
await fetchStrapi("/api/articles/" + slug + "?" + query)`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Draft & Publish changes the query",
      text: "With draftAndPublish enabled, unpublished entries are hidden unless you pass publicationState=preview and an authenticated token. The preview route uses exactly this to render drafts for editors.",
    },
  ],
}
