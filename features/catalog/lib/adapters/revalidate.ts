import { revalidatePath } from "next/cache"

/**
 * Bust every cached route that renders catalog data (price/stock/name/etc.)
 * after any write that changes it — an admin edit, a sale, a refund, or a
 * released reservation. Shared so every stock-affecting mutation path
 * (checkout, refunds, admin catalog edits) invalidates the same cache the
 * same way, instead of each call site inventing its own revalidation list.
 */
export function revalidateCatalog(): void {
  revalidatePath("/")
  revalidatePath("/products")
  // The product's own page is the one that decides between "Add to cart" and the
  // back-in-stock form. Without this it kept serving a cached "in stock" render
  // after an admin sold it out, so a shopper could still add a sold-out item.
  revalidatePath("/products/[slug]", "page")
  revalidatePath("/admin")
}
