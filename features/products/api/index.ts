import "server-only"

import {
  getAllProducts,
  getProductBySlug,
  getFeaturedProducts,
  getProductSlugs,
} from "@/lib/data/products"
import { env } from "@/lib/env"
import { fetchStrapi, toEntries } from "@/lib/strapi/client"
import { strapiTags } from "@/lib/strapi/tags"
import { z } from "zod"
import { productSchema, type Product } from "../schema"
import { selectRelatedProducts } from "../lib/product"
import { mapStrapiProduct } from "../mappers"

/**
 * Product data access — the single seam the Strapi migration flips.
 *
 * When `STRAPI_API_URL` is set, these read from the CMS through the hardened
 * `fetchStrapi` transport, transform via the mapper, validate with
 * `productSchema`, and attach cache tags for on-publish revalidation. Until
 * then they fall back to the local `lib/data` source — same return types, so
 * pages, `generateStaticParams`, and the Suspense boundaries never change.
 *
 * `server-only` keeps this (and the Strapi token) out of client bundles.
 */

const useStrapi = Boolean(env.STRAPI_API_URL)
const revalidate = env.STRAPI_REVALIDATE_SECONDS

export async function fetchProducts(): Promise<Product[]> {
  if (useStrapi) {
    return fetchStrapi("/api/products?populate=*", {
      parse: (data) => productSchema.array().parse(toEntries(data).map(mapStrapiProduct)),
      tags: [strapiTags.products.all()],
      revalidate,
    })
  }
  return productSchema.array().parse(getAllProducts())
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  if (useStrapi) {
    return fetchStrapi(`/api/products?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`, {
      parse: (data) => {
        const [first] = toEntries(data).map(mapStrapiProduct)
        return first ? productSchema.parse(first) : null
      },
      tags: [strapiTags.products.detail(slug), strapiTags.products.all()],
      revalidate,
    })
  }
  const raw = getProductBySlug(slug)
  return raw ? productSchema.parse(raw) : null
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  if (useStrapi) {
    return fetchStrapi("/api/products?filters[featured][$eq]=true&populate=*", {
      parse: (data) => productSchema.array().parse(toEntries(data).map(mapStrapiProduct)),
      tags: [strapiTags.products.all()],
      revalidate,
    })
  }
  return productSchema.array().parse(getFeaturedProducts())
}

export async function fetchProductSlugs(): Promise<string[]> {
  if (useStrapi) {
    return fetchStrapi("/api/products?fields[0]=slug", {
      parse: (data) => z.string().array().parse(toEntries(data).map((e: any) => (e?.attributes ?? e)?.slug)),
      tags: [strapiTags.products.all()],
      revalidate,
    })
  }
  return getProductSlugs()
}

export async function fetchRelatedProducts(slug: string, limit = 3): Promise<Product[]> {
  const all = await fetchProducts()
  return selectRelatedProducts(all, slug, limit)
}
