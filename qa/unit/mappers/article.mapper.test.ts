import { describe, expect, it } from "vitest"

import { mapStrapiArticle } from "@/features/articles/mappers"
import { articleSchema } from "@/features/articles/schema"
import { strapiArticleEntry } from "@/qa/fixtures/strapi/article.fixture"

describe("mapStrapiArticle", () => {
  it("maps a full Strapi entry into a valid domain article", () => {
    const parsed = articleSchema.parse(mapStrapiArticle(strapiArticleEntry))

    expect(parsed.slug).toBe("inside-the-anechoic-lab")
    expect(parsed.author).toEqual({ name: "Dara Okonkwo", role: "Lead Acoustic Engineer" })
    expect(typeof parsed.coverImage).toBe("string")
    expect(parsed.readingMinutes).toBe(6)
  })

  it("maps every body block type through the discriminated union", () => {
    const parsed = articleSchema.parse(mapStrapiArticle(strapiArticleEntry))
    expect(parsed.body.map((b) => b.type)).toEqual(["paragraph", "heading", "quote"])

    const quote = parsed.body.find((b) => b.type === "quote")
    expect(quote).toMatchObject({ attribution: "Dara Okonkwo" })
  })

  it("fails loudly when the title is missing (contract drift)", () => {
    const broken = { ...strapiArticleEntry, title: undefined }
    expect(() => articleSchema.parse(mapStrapiArticle(broken))).toThrow()
  })
})
