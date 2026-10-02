import { renderOgImage, OG_SIZE } from "@/lib/seo/og"
import { fetchDoc } from "@/features/docs/api"
import { docAudienceMeta } from "@/features/docs/schema"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Momo Audio documentation"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = await fetchDoc(slug)

  // Owner-only docs must not leak their title through a public preview card.
  if (!doc || doc.access !== "public") {
    return renderOgImage({ eyebrow: "Docs", title: "Momo Audio Documentation", footer: "momoaudio.com/docs" })
  }

  return renderOgImage({
    eyebrow: `${docAudienceMeta[doc.audience].label} · ${doc.category}`,
    title: doc.title,
    footer: `${doc.readingMinutes} min read · momoaudio.com/docs`,
  })
}
