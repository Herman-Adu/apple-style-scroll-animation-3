import { renderOgImage, OG_SIZE } from "@/lib/seo/og"
import { fetchProduct } from "@/features/products/api"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Momo Audio product"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await fetchProduct(slug)

  return renderOgImage({
    eyebrow: product ? product.category : "Momo Audio",
    title: product ? product.name : "Momo Audio",
    footer: product ? product.tagline : "momoaudio.com",
  })
}
