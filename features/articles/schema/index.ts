import { z } from "zod"

/** Source of truth for the editorial/article domain. */

export const authorSchema = z.object({
  name: z.string(),
  role: z.string(),
})
export type Author = z.infer<typeof authorSchema>

export const articleBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({ type: z.literal("heading"), text: z.string() }),
  z.object({ type: z.literal("quote"), text: z.string(), attribution: z.string().optional() }),
])
export type ArticleBlock = z.infer<typeof articleBlockSchema>

export const articleSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  category: z.enum(["Engineering", "Design", "Sound"]),
  coverImage: z.string(),
  author: authorSchema,
  publishedAt: z.string(),
  readingMinutes: z.number(),
  body: z.array(articleBlockSchema),
})
export type Article = z.infer<typeof articleSchema>
