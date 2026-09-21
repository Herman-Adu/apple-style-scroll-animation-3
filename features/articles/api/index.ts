import "server-only"

import { getAllArticles, getArticleBySlug, getArticleSlugs } from "@/lib/data/articles"
import { env } from "@/lib/env"
import { fetchStrapi, toEntries } from "@/lib/strapi/client"
import { strapiTags } from "@/lib/strapi/tags"
import { z } from "zod"
import { articleSchema, type Article } from "../schema"
import { selectMoreArticles } from "../lib/article"
import { mapStrapiArticle } from "../mappers"

/**
 * Article data access. Same seam and rationale as the products `api` — reads
 * from Strapi when configured (mapper + zod + cache tags), otherwise from the
 * local `lib/data` source, with identical return types either way.
 */

const useStrapi = Boolean(env.STRAPI_API_URL)
const revalidate = env.STRAPI_REVALIDATE_SECONDS

export async function fetchArticles(): Promise<Article[]> {
  if (useStrapi) {
    return fetchStrapi("/api/articles?populate=*&sort=publishedAt:desc", {
      parse: (data) => articleSchema.array().parse(toEntries(data).map(mapStrapiArticle)),
      tags: [strapiTags.articles.all()],
      revalidate,
    })
  }
  return articleSchema.array().parse(getAllArticles())
}

export async function fetchArticle(slug: string): Promise<Article | null> {
  if (useStrapi) {
    return fetchStrapi(`/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`, {
      parse: (data) => {
        const [first] = toEntries(data).map(mapStrapiArticle)
        return first ? articleSchema.parse(first) : null
      },
      tags: [strapiTags.articles.detail(slug), strapiTags.articles.all()],
      revalidate,
    })
  }
  const raw = getArticleBySlug(slug)
  return raw ? articleSchema.parse(raw) : null
}

export async function fetchArticleSlugs(): Promise<string[]> {
  if (useStrapi) {
    return fetchStrapi("/api/articles?fields[0]=slug", {
      parse: (data) => z.string().array().parse(toEntries(data).map((e: any) => (e?.attributes ?? e)?.slug)),
      tags: [strapiTags.articles.all()],
      revalidate,
    })
  }
  return getArticleSlugs()
}

export async function fetchMoreArticles(slug: string, limit = 3): Promise<Article[]> {
  const all = await fetchArticles()
  return selectMoreArticles(all, slug, limit)
}
