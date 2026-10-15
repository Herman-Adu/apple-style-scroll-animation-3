import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CAROUSEL_ID,
  InfographicSlide,
  SocialSlide,
  exportRenderSlides,
  briefId,
  briefs,
  infographics,
  packCarouselId,
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
    ...briefs.map((b) => ({ asset: briefId(b.id) })),
    ...socialAssets.map((a) => ({ asset: a.id })),
    ...infographics.map((i) => ({ asset: i.id })),
  ]
}

export const dynamicParams = false

export default async function ShowcaseRenderPage({ params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params

  // The one resolution of what this export renders: the same function the
  // manifest hashes, so a published file's recorded source is the source that
  // drew it. Page numbers included - the shell prints them.
  const pages = exportRenderSlides(asset)
  if (pages.length === 0) notFound()

  const facts = await loadFacts()

  return (
    <main className="flex flex-col">
      {pages.map(({ slide, position }) =>
        "kind" in slide ? (
          <InfographicSlide key={slide.id} infographic={slide} facts={facts} position={position} />
        ) : (
          <SocialSlide key={slide.id} asset={slide} position={position} />
        ),
      )}
    </main>
  )
}
