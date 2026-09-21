/**
 * Hand-written Strapi v5 payloads for a product, in the flat `{ data, meta }`
 * envelope the mapper consumes. These fixtures are the migration safety net:
 * if the real CMS content-type drifts from what `mapStrapiProduct` expects,
 * the mapper unit tests fail here instead of in production.
 *
 * `productListResponse` mirrors `GET /api/products?populate=*`.
 * `productSingleResponse` mirrors a filtered-by-slug list (Strapi returns an
 * array even for a single match).
 */
export const strapiProductEntry = {
  id: 1,
  documentId: "prod_momo_x",
  slug: "momo-x",
  name: "Momo X",
  tagline: "Pure Sound. Zero Compromise.",
  category: "Headphones",
  priceAmount: 549,
  priceCurrency: "USD",
  summary: "The flagship over-ear. Titanium build, 40mm planar drivers, and reference-grade silence.",
  description: "Momo X is the culmination of a decade of acoustic research.",
  accent: "oklch(0.72 0.15 250)",
  featured: true,
  releaseStatus: "preorder",
  colors: ["Titanium", "Midnight", "Stone"],
  image: {
    data: { attributes: { url: "/uploads/momo_x_00096.jpg" } },
  },
  hero: {
    kind: "parallax",
    image: "/uploads/momo_x_hero.jpg",
    accent: "oklch(0.72 0.15 250)",
    motion: "orbit",
    scrollVh: 400,
    intro: { kicker: "Introducing", title: "Momo X", subtitle: "Pure Sound. Zero Compromise." },
    beats: [
      {
        index: "01",
        title: "Designed for\nPrecision.",
        description: "Sub-millimeter accuracy for perfect acoustic response.",
        align: "left",
        window: [0.18, 0.28, 0.42, 0.52],
      },
    ],
  },
  features: [
    { title: "Active Noise Cancellation", description: "-45dB adaptive reduction.", stat: "-45", statUnit: "dB" },
  ],
  specs: [
    { label: "Driver", value: "40mm planar magnetic" },
    { label: "Battery", value: "60", unit: "hours" },
  ],
}

export const productListResponse = {
  data: [strapiProductEntry],
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
}

export const productSingleResponse = {
  data: [strapiProductEntry],
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
}

export const productEmptyResponse = {
  data: [],
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
}
