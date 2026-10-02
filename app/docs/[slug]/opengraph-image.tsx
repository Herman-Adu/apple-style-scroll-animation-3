import { renderOgImage, OG_SIZE } from "@/lib/seo/og"
import { docs } from "@/features/docs"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Momo Audio documentation"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = docs.find((d) => d.slug === slug && d.access === "public")

  return renderOgImage({
    eyebrow: doc ? doc.category : "Documentation",
    title: doc ? doc.title : "Momo Audio Docs",
    footer: doc ? `Docs · ${doc.readingMinutes} min read` : "momoaudio.com/docs",
  })
}
