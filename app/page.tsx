import { StoryHero } from "@/components/scroll/story-hero"
import { BrandStatement } from "@/components/home/brand-statement"
import { ProductShowcase } from "@/features/products"
import { FeaturedArticles } from "@/features/articles"
import { fetchProduct, fetchProducts } from "@/features/products/api"
import { fetchArticles } from "@/features/articles/api"

export default async function HomePage() {
  const [flagship, products, allArticles] = await Promise.all([
    fetchProduct("momo-x"),
    fetchProducts(),
    fetchArticles(),
  ])
  const articles = allArticles.slice(0, 3)

  return (
    <main>
      {flagship && (
        <div id="top" className="scroll-mt-24">
          <StoryHero product={flagship} />
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
