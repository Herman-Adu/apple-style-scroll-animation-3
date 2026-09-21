import type { Article } from "../schema"

/** Pure domain selectors for articles. */

export function selectMoreArticles(articles: Article[], slug: string, limit = 3): Article[] {
  return articles.filter((article) => article.slug !== slug).slice(0, limit)
}

/**
 * Filter articles by a free-text query, matched (case-insensitive) against
 * title, excerpt, and category. Pure and order-preserving.
 */
export function filterArticles(articles: Article[], query?: string): Article[] {
  const q = query?.trim().toLowerCase()
  if (!q) return articles
  return articles.filter((article) =>
    [article.title, article.excerpt, article.category].some((field) => field.toLowerCase().includes(q)),
  )
}
