import type { Product } from "../schema"

/** Pure domain selectors — no I/O, safe to unit test and reuse anywhere. */

/**
 * Inventory rules — the single source of truth for "can this be sold, and how
 * many". Every surface (product card, purchase panel, cart, checkout guard,
 * admin) derives its state from these so the storefront can never sell a unit
 * that isn't there.
 */

export type StockLevel = "in-stock" | "low-stock" | "out-of-stock" | "preorder" | "coming-soon"

/** Units actually available to sell right now (never negative). */
export function effectiveStock(product: Pick<Product, "stock" | "reserved">): number {
  return Math.max(0, product.stock - product.reserved)
}

export function isInStock(product: Pick<Product, "stock" | "reserved">): boolean {
  return effectiveStock(product) > 0
}

export function isLowStock(product: Pick<Product, "stock" | "reserved" | "lowStockThreshold">): boolean {
  const available = effectiveStock(product)
  return available > 0 && available <= product.lowStockThreshold
}

/**
 * The one rule that decides whether an Add-to-cart / Pre-order action is
 * allowed. Pre-orders sell without physical stock; coming-soon never sells;
 * available products sell only while units remain.
 */
export function isPurchasable(product: Product): boolean {
  if (product.releaseStatus === "coming-soon") return false
  if (product.releaseStatus === "preorder") return true
  return isInStock(product)
}

export function stockLevel(product: Product): StockLevel {
  if (product.releaseStatus === "coming-soon") return "coming-soon"
  if (product.releaseStatus === "preorder") return "preorder"
  if (!isInStock(product)) return "out-of-stock"
  return isLowStock(product) ? "low-stock" : "in-stock"
}

/** Short, human label for a stock state — reused by badges across the app. */
export function stockLabel(product: Product): string {
  switch (stockLevel(product)) {
    case "coming-soon":
      return "Coming soon"
    case "preorder":
      return "Pre-order"
    case "out-of-stock":
      return "Sold out"
    case "low-stock":
      return `Only ${effectiveStock(product)} left`
    default:
      return "In stock"
  }
}

/** How many units a customer may still add, given what's already in their cart. */
export function purchasableQuantity(product: Product, alreadyInCart = 0): number {
  if (product.releaseStatus === "coming-soon") return 0
  if (product.releaseStatus === "preorder") return Number.POSITIVE_INFINITY
  return Math.max(0, effectiveStock(product) - alreadyInCart)
}

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
