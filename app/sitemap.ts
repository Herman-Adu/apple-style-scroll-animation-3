import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo/site"
import { fetchProductSlugs } from "@/features/products/api"
import { fetchArticles } from "@/features/articles/api"

/**
 * Sitemap is generated from the same feature `api` layer that renders the
 * pages, so it stays in sync automatically once Strapi is the source.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productSlugs, articles] = await Promise.all([fetchProductSlugs(), fetchArticles()])

  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/articles"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ]

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: absoluteUrl(`/products/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: absoluteUrl(`/articles/${article.slug}`),
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...productRoutes, ...articleRoutes]
}
