import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ProductCard, ProductGridSkeleton, filterProducts } from "@/features/products"
import { fetchProducts } from "@/features/products/api"
import { pageHeroes } from "@/lib/data/heroes"
import { PageHero } from "@/components/layout/page-hero"
import { SearchField } from "@/components/primitives"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Products",
  description: "Explore the full Momo collection of headphones, earbuds, and speakers.",
}

const CATEGORIES = ["Headphones", "Earbuds", "Speakers"] as const
type Category = (typeof CATEGORIES)[number]

async function ProductGrid({ category, query }: { category?: Category; query?: string }) {
  const allProducts = await fetchProducts()
  const products = filterProducts(allProducts, { category, query })

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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category, q } = await searchParams
  const activeCategory = CATEGORIES.find((c) => c.toLowerCase() === category?.toLowerCase())
  const query = q?.trim() || undefined

  // Preserve the active query when switching category filters.
  const withQuery = (href: string) => (query ? `${href}${href.includes("?") ? "&" : "?"}q=${encodeURIComponent(query)}` : href)

  const filters: { label: string; href: string; active: boolean }[] = [
    { label: "All", href: withQuery("/products"), active: !activeCategory },
    ...CATEGORIES.map((c) => ({
      label: c,
      href: withQuery(`/products?category=${c}`),
      active: activeCategory === c,
    })),
  ]

  return (
    <main className="bg-background">
      <PageHero content={pageHeroes.products} />

      <section className="px-6 pt-16 md:px-12 md:pt-24">
        <div className="mx-auto max-w-7xl">
          <p className="max-w-xl text-lg text-foreground/60">
            {activeCategory
              ? `Our ${activeCategory.toLowerCase()}, engineered in the same lab and tuned to the same standard.`
              : "Four ways to hear the truth of a recording — engineered in the same lab, tuned to the same standard."}
          </p>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Filter products by category" className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Link
                  key={filter.href}
                  href={filter.href}
                  aria-current={filter.active ? "page" : undefined}
                  className={cn(
                    "rounded-full border px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors",
                    filter.active
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/15 text-foreground/60 hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              ))}
            </nav>

            <SearchField
              label="Search products"
              placeholder="Search products…"
              className="w-full lg:w-72"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:px-12 md:py-20">
        <Suspense key={`${activeCategory ?? "all"}:${query ?? ""}`} fallback={<ProductGridSkeleton count={6} />}>
          <ProductGrid category={activeCategory} query={query} />
        </Suspense>
      </section>
    </main>
  )
}
