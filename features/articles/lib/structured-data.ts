import { siteConfig } from "@/lib/data/site"
import { absoluteUrl } from "@/lib/seo/site"
import type { Article } from "../schema"

export function articleLd(article: Article): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absoluteUrl(article.coverImage),
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    articleSection: article.category,
    author: { "@type": "Person", name: article.author.name, jobTitle: article.author.role },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/articles/${article.slug}`) },
  }
}
