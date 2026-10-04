import "server-only"

import { strapiMedia } from "@/lib/strapi/media"

/**
 * Anti-corruption layer: Strapi raw entry -> pre-validation article shape.
 * Output feeds directly into `articleSchema.parse(...)`. See the products
 * mapper for the rationale behind the `any` input and boundary validation.
 */
export function mapStrapiArticle(entry: any): unknown {
  const a = entry?.attributes ?? entry ?? {}

  return {
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    coverImage: strapiMedia(a.coverImage),
    author: {
      name: a.author?.name ?? a.authorName,
      role: a.author?.role ?? a.authorRole,
    },
    // Strapi datetimes are ISO strings; the schema keeps them as strings.
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    body: (a.body ?? []).map(mapBlock),
  }
}

/** Normalize a body block; the discriminated union validates `type` downstream. */
function mapBlock(block: any): unknown {
  switch (block?.type) {
    case "quote":
      return { type: "quote", text: block.text, attribution: block.attribution ?? undefined }
    case "heading":
      return { type: "heading", text: block.text }
    case "paragraph":
    default:
      return { type: "paragraph", text: block.text }
  }
}
