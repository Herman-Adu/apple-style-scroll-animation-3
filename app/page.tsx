import { FrameScrollHero } from "@/components/scroll/frame-scroll-hero"
import { BrandStatement } from "@/components/home/brand-statement"
import { ProductShowcase } from "@/features/products"
import { FeaturedArticles } from "@/features/articles"
import { fetchProduct, fetchProducts } from "@/features/products/server"
import { fetchArticles } from "@/features/articles/server"

export default async function HomePage() {
  const [flagship, products, allArticles] = await Promise.all([
    fetchProduct("momo-x"),
    fetchProducts(),
    fetchArticles(),
  ])
  const articles = allArticles.slice(0, 3)

  return (
    <main>
      {/* The front door's cinematic, rendered explicitly. `StoryHero` used to
          switch between three renderers by `hero.kind`; with the product pages
          static there is one case left, and one indirection for one case is
          not worth a file. */}
      {flagship?.cinematicHero && (
        <div id="top" className="scroll-mt-24">
          <FrameScrollHero hero={flagship.cinematicHero} product={flagship} />
        </div>
      )}
      <div id="statement" className="scroll-mt-24">
        <BrandStatement />
      </div>
      <div id="collection" className="scroll-mt-24">
        <ProductShowcase products={products} />
      </div>
      <div id="journal" className="scroll-mt-24">
        <FeaturedArticles articles={articles} />
      </div>
    </main>
  )
}
