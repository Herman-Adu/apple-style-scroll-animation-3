import "server-only";

import { strapiMedia } from "@/lib/strapi/media";

/**
 * Anti-corruption layer: Strapi raw entry -> pre-validation article shape.
 * Output feeds directly into `articleSchema.parse(...)`. See the products
 * mapper for the rationale behind the `any` input and boundary validation.
 */
export function mapStrapiArticle(entry: unknown): unknown {
  const row =
    entry && typeof entry === "object"
      ? (entry as Record<string, unknown>)
      : {};
  const attrs = row.attributes;
  const a =
    attrs && typeof attrs === "object"
      ? (attrs as Record<string, unknown>)
      : row;

  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    coverImage: strapiMedia(a.coverImage),
    author: (() => {
      const author = a.author;
      const authorRow =
        author && typeof author === "object"
          ? (author as Record<string, unknown>)
          : {};
      return {
        name: authorRow.name ?? a.authorName,
        role: authorRow.role ?? a.authorRole,
      };
    })(),
    // Strapi datetimes are ISO strings; the schema keeps them as strings.
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    body: Array.isArray(a.body) ? a.body.map(mapBlock) : [],
  };
}

/** Normalize a body block; the discriminated union validates `type` downstream. */
function mapBlock(block: unknown): unknown {
  const row =
    block && typeof block === "object"
      ? (block as Record<string, unknown>)
      : {};
  switch (row.type) {
    case "quote":
      return {
        type: "quote",
        text: row.text,
        attribution: row.attribution ?? undefined,
      };
    case "heading":
      return { type: "heading", text: row.text };
    case "paragraph":
    default:
      return { type: "paragraph", text: row.text };
  }
}
