/**
 * Hand-written Strapi payload for an article, in the flat `{ data, meta }`
 * envelope `mapStrapiArticle` consumes. Covers all three body block types
 * (paragraph, heading, quote) so the discriminated-union mapping is exercised.
 */
export const strapiArticleEntry = {
  id: 1,
  documentId: "art_anechoic",
  slug: "inside-the-anechoic-lab",
  title: "Inside the Anechoic Lab",
  excerpt: "Where does a sound go when there is nothing to reflect it?",
  category: "Engineering",
  authorName: "Dara Okonkwo",
  authorRole: "Lead Acoustic Engineer",
  publishedAt: "2026-02-18",
  readingMinutes: 6,
  coverImage: {
    data: { attributes: { url: "/uploads/acoustics_lab.png" } },
  },
  body: [
    { type: "paragraph", text: "Step inside our anechoic chamber and the first thing you notice is what you cannot hear." },
    { type: "heading", text: "Measuring the truth" },
    { type: "quote", text: "In here there is no room to blame.", attribution: "Dara Okonkwo" },
  ],
}

export const articleListResponse = {
  data: [strapiArticleEntry],
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
}

export const articleSingleResponse = {
  data: [strapiArticleEntry],
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
}
