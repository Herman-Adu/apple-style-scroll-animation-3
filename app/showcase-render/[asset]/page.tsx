import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CAROUSEL_ID, carouselSlides, getSocialAsset, socialAssets } from "@/features/showcase"
import { SocialSlide } from "@/features/showcase"

export const metadata: Metadata = {
  title: "Showcase render",
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return [{ asset: CAROUSEL_ID }, ...socialAssets.map((a) => ({ asset: a.id }))]
}

export const dynamicParams = false

export default async function ShowcaseRenderPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params

  if (asset === CAROUSEL_ID) {
    const slides = carouselSlides()
    return (
      <main className="flex flex-col">
        {slides.map((slide, index) => (
          <SocialSlide key={slide.id} asset={slide} position={{ index, total: slides.length }} />
        ))}
      </main>
    )
  }

  const found = getSocialAsset(asset)
  if (!found) notFound()

  const slides = carouselSlides()
  const index = slides.findIndex((s) => s.id === found.id)

  return (
    <main>
      <SocialSlide asset={found} position={index >= 0 ? { index, total: slides.length } : undefined} />
    </main>
  )
}
