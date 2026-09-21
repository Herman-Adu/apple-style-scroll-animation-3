import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { StoryHero } from "@/components/scroll/story-hero"
import {
  ProductFeatures,
  ProductSpecs,
  ProductPurchase,
  ProductCard,
  ProductGridSkeleton,
  ProductReviews,
} from "@/features/products"
import { fetchProduct, fetchProductSlugs, fetchRelatedProducts } from "@/features/products/api"
import { JsonLd } from "@/components/seo/json-ld"
import { productLd, breadcrumbLd } from "@/lib/seo/structured-data"
import { absoluteUrl } from "@/lib/seo/site"

export async function generateStaticParams() {
  const slugs = await fetchProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: "Product not found" }
  const canonical = `/products/${product.slug}`
  return {
    title: product.name,
    description: product.summary,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.summary,
      url: absoluteUrl(canonical),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.summary,
    },
  }
}

async function RelatedProducts({ slug }: { slug: string }) {
  const related = await fetchRelatedProducts(slug)
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {related.map((item, index) => (
        <ProductCard key={item.slug} product={item} index={index} />
      ))}
    </div>
  )
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) notFound()

  return (
    <main className="bg-background">
      <JsonLd
        data={[
          productLd(product),
          breadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
        ]}
      />
      <StoryHero product={product} />

      {/* Purchase section */}
      <section className="relative z-10 border-t border-foreground/10 px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-foreground/10">
            <div
              className="absolute inset-0 opacity-50 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 45%, ${product.accent}, transparent 65%)` }}
              aria-hidden
            />
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <ProductPurchase product={product} />
        </div>
      </section>

      <ProductFeatures features={product.features} />
      <ProductSpecs specs={product.specs} />

      <ProductReviews productSlug={product.slug} productName={product.name} />

      {/* Related products */}
      <section className="relative z-10 border-t border-foreground/10 px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex items-end justify-between gap-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">More from Momo</h2>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              All products
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton />}>
            <RelatedProducts slug={product.slug} />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
