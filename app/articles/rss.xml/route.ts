import { fetchArticles } from "@/features/articles/api"
import { absoluteUrl } from "@/lib/seo/site"
import { siteConfig } from "@/lib/data/site"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** RSS 2.0 feed for the journal, generated from the article `api` layer. */
export async function GET() {
  const articles = await fetchArticles()

  const items = articles
    .map((article) => {
      const url = absoluteUrl(`/articles/${article.slug}`)
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.excerpt)}</description>
      <category>${escapeXml(article.category)}</category>
      <dc:creator>${escapeXml(article.author.name)}</dc:creator>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)} — Journal</title>
    <link>${absoluteUrl("/articles")}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/articles/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
