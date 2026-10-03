import { siteConfig } from "@/lib/data/site"
import { absoluteUrl } from "@/lib/seo/site"
import type { Product } from "./schema"

const availabilityFor = (status: Product["releaseStatus"]): string =>
  status === "available" ? "https://schema.org/InStock" : "https://schema.org/PreOrder"

export function productLd(product: Product): Record<string, unknown> {
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
