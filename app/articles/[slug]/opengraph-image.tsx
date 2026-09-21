import { renderOgImage, OG_SIZE } from "@/lib/seo/og"
import { fetchArticle } from "@/features/articles/api"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Momo Audio journal"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await fetchArticle(slug)

  return renderOgImage({
    eyebrow: article ? article.category : "Journal",
    title: article ? article.title : "Momo Audio Journal",
    footer: article ? `${article.author.name} · ${article.readingMinutes} min read` : "momoaudio.com",
  })
}
