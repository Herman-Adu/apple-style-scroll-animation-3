/**
 * Cache-tag taxonomy shared by the data layer and the revalidation webhook.
 *
 * Every CMS fetch attaches the relevant tags via `fetch(..., { next: { tags } })`.
 * When an editor publishes in Strapi, the webhook (`app/api/revalidate`) calls
 * `revalidateTag` with the matching tag, so only the affected pages refresh —
 * instantly, without a redeploy.
 *
 * Keeping the strings in one place means the producer (fetch) and the consumer
 * (webhook) can never drift apart.
 */
export const strapiTags = {
  products: {
    all: () => "products",
    detail: (slug: string) => `product:${slug}`,
  },
  articles: {
    all: () => "articles",
    detail: (slug: string) => `article:${slug}`,
  },
  timeline: {
    all: () => "timeline",
  },
  docs: {
    all: () => "docs",
    detail: (slug: string) => `doc:${slug}`,
  },
} as const

/** Strapi content-type UID / model name -> the cache tags it should bust. */
export function tagsForModel(model: string, slug?: string): string[] {
  switch (model) {
    case "product":
      return slug ? [strapiTags.products.all(), strapiTags.products.detail(slug)] : [strapiTags.products.all()]
    case "article":
      return slug ? [strapiTags.articles.all(), strapiTags.articles.detail(slug)] : [strapiTags.articles.all()]
    case "milestone":
      return [strapiTags.timeline.all()]
    case "doc":
      return slug ? [strapiTags.docs.all(), strapiTags.docs.detail(slug)] : [strapiTags.docs.all()]
    default:
      return []
  }
}
