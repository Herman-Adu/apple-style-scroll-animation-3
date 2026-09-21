import type { Product } from "../schema"

/** Pure domain selectors — no I/O, safe to unit test and reuse anywhere. */

export function selectRelatedProducts(products: Product[], slug: string, limit = 3): Product[] {
  return products.filter((product) => product.slug !== slug).slice(0, limit)
}

export function selectByCategory(products: Product[], category: Product["category"]): Product[] {
  return products.filter((product) => product.category === category)
}

/**
 * Filter products by optional category and free-text query. Query matches
 * (case-insensitive) against name, summary, and category. Pure and
 * order-preserving so it's safe to unit test and reuse on server or client.
 */
export function filterProducts(
  products: Product[],
  { category, query }: { category?: Product["category"]; query?: string } = {},
): Product[] {
  let result = category ? selectByCategory(products, category) : products
  const q = query?.trim().toLowerCase()
  if (q) {
    result = result.filter((product) =>
      [product.name, product.summary, product.category].some((field) => field.toLowerCase().includes(q)),
    )
  }
  return result
}
