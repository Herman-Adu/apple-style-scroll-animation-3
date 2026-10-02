import { siteConfig } from "@/lib/data/site"
import { absoluteUrl, getBaseUrl } from "./site"

/**
 * Site-wide schema.org JSON-LD builders. Kept as plain objects (not stringified)
 * so callers can batch several into one <script> via the JsonLd component.
 * Product and article builders live in their slices (productLd, articleLd).
 */

type Json = Record<string, unknown>
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
