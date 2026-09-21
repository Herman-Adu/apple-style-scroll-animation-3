import { describe, expect, it } from "vitest"

import { articleLd, breadcrumbLd, organizationLd, productLd, websiteLd } from "@/lib/seo/structured-data"
import { productSchema } from "@/features/products/schema"
import { articleSchema } from "@/features/articles/schema"
import { mapStrapiProduct } from "@/features/products/mappers"
import { mapStrapiArticle } from "@/features/articles/mappers"
import { strapiProductEntry } from "@/qa/fixtures/strapi/product.fixture"
import { strapiArticleEntry } from "@/qa/fixtures/strapi/article.fixture"

const product = productSchema.parse(mapStrapiProduct(strapiProductEntry))
const article = articleSchema.parse(mapStrapiArticle(strapiArticleEntry))

describe("structured data builders", () => {
  it("emit valid schema.org node types", () => {
    expect(organizationLd()["@type"]).toBe("Organization")
    expect(websiteLd()["@type"]).toBe("WebSite")
    expect(productLd(product)["@type"]).toBe("Product")
    expect(articleLd(article)["@type"]).toBe("Article")
  })

  it("builds a Product offer from domain price + release status", () => {
    const offer = (productLd(product) as any).offers
    expect(offer).toMatchObject({
      "@type": "Offer",
      price: 549,
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    })
    expect(offer.url).toMatch(/\/products\/momo-x$/)
  })

  it("builds an Article author + publisher graph", () => {
    const ld = articleLd(article) as any
    expect(ld.author).toMatchObject({ "@type": "Person", name: "Dara Okonkwo" })
    expect(ld.publisher["@type"]).toBe("Organization")
    expect(ld.headline).toBe(article.title)
  })

  it("numbers breadcrumb positions from 1 with absolute item URLs", () => {
    const ld = breadcrumbLd([
      { name: "Products", path: "/products" },
      { name: "Momo X", path: "/products/momo-x" },
    ]) as any
    expect(ld.itemListElement).toHaveLength(2)
    expect(ld.itemListElement[0].position).toBe(1)
    expect(ld.itemListElement[1].item).toMatch(/^https?:\/\/.+\/products\/momo-x$/)
  })
})
