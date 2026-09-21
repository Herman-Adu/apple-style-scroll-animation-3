"use client"

// Client overlay for the products listing grid. Seeded with the server-rendered
// products (so first paint matches SSR and SEO crawlers see real content), then
// switches to the live catalog after mount so admin create / delete / edit
// changes reflect on the storefront pre-Strapi. Filtering reuses the same pure
// `filterProducts` selector the server used, so behavior is identical.

import { useCatalog } from "@/features/catalog"
import type { Product } from "@/lib/types"
import { filterProducts } from "@/features/products/lib/product"
import { ProductCard } from "./product-card"

interface ProductCollectionProps {
  initialProducts: Product[]
  category?: Product["category"]
  query?: string
}

export function ProductCollection({ initialProducts, category, query }: ProductCollectionProps) {
  const catalog = useCatalog()
  // Before the provider mounts, `products` already equals the SSR seed, so this
  // renders identical markup on the first client pass — no hydration mismatch.
  const source = catalog.products.length > 0 ? catalog.products : initialProducts
  const products = filterProducts(source, { category, query })

  if (products.length === 0) {
    return (
      <p className="mx-auto max-w-7xl text-foreground/50">
        {query
          ? `No products match “${query}”${category ? ` in ${category}` : ""}. Try a different search.`
          : "No products in this category yet."}
      </p>
    )
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} index={index} />
      ))}
    </div>
  )
}
