import type { Product } from "@/features/products/schema"
import type { Article } from "@/features/articles/schema"
import { siteConfig } from "@/lib/data/site"
import { absoluteUrl, getBaseUrl } from "./site"

/**
 * schema.org JSON-LD builders. Kept as plain objects (not stringified) so
 * callers can batch several into one <script> via the JsonLd component. All
 * URLs run through `absoluteUrl` so they stay valid across environments.
 */

type Json = Record<string, unknown>

const availabilityFor = (status: Product["releaseStatus"]): string =>
  status === "available" ? "https://schema.org/InStock" : "https://schema.org/PreOrder"

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getBaseUrl(),
    description: siteConfig.description,
    email: siteConfig.email,
    foundingDate: String(siteConfig.founded),
    logo: absoluteUrl("/icon.svg"),
  }
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getBaseUrl(),
    description: siteConfig.description,
  }
}

export function productLd(product: Product): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: absoluteUrl(product.image),
    category: product.category,
    color: product.colors,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: product.price.amount,
      priceCurrency: product.price.currency,
      availability: availabilityFor(product.releaseStatus),
      url: absoluteUrl(`/products/${product.slug}`),
    },
  }
}

export function articleLd(article: Article): Json {
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

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
