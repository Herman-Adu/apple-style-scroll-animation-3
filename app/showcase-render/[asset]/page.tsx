import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CAROUSEL_ID,
  InfographicSlide,
  SocialSlide,
  carouselSlides,
  getInfographic,
  getPackByCarouselId,
  getSocialAsset,
  infographics,
  packCarouselId,
  packSlides,
  packs,
  socialAssets,
} from "@/features/showcase"
import { loadFacts } from "@/features/showcase/server"

export const metadata: Metadata = {
  title: "Showcase render",
  robots: { index: false, follow: false },
}

export function generateStaticParams() {
  return [
    { asset: CAROUSEL_ID },
    ...packs.map((p) => ({ asset: packCarouselId(p.id) })),
    ...socialAssets.map((a) => ({ asset: a.id })),
    ...infographics.map((i) => ({ asset: i.id })),
  ]
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

  const pack = getPackByCarouselId(asset)
  if (pack) {
    const slides = packSlides(pack)
    const facts = await loadFacts()
    return (
      <main className="flex flex-col">
        {slides.map((slide, index) => {
          const position = { index, total: slides.length }
          return "kind" in slide ? (
            <InfographicSlide key={slide.id} infographic={slide} facts={facts} position={position} />
          ) : (
            <SocialSlide key={slide.id} asset={slide} position={position} />
          )
        })}
      </main>
    )
  }

  const infographic = getInfographic(asset)
  if (infographic) {
    const facts = await loadFacts()
    return (
      <main>
        <InfographicSlide infographic={infographic} facts={facts} />
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
