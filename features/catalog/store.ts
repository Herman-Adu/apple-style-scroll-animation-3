// Catalog persistence — pure store logic + browser IO.
//
// Pre-Strapi, this is the shared datastore the admin writes to and the
// storefront reads from. It's seeded from the server catalog and persisted to
// localStorage, so admin CRUD and stock changes survive reloads and reflect on
// the storefront within the same browser. Every mutation is a pure function
// over a ProductMap; the React provider in `catalog-context.tsx` orchestrates
// state, persistence, and cross-tab sync.
//
// When Strapi is connected, these same operations map 1:1 onto
// create/update/delete calls through `mutateStrapi`, and this local overlay is
// bypassed (the server becomes the source of truth). The shapes below are the
// contract that migration targets.

import type { Product } from "@/features/products"
import { productSchema } from "@/features/products"
import { effectiveStock } from "@/features/products"

export const CATALOG_STORAGE_KEY = "momo.catalog.v1"

export type ProductMap = Record<string, Product>

/** Editable fields exposed to the admin. Everything else on a Product is preserved. */
export interface ProductPatch {
  name?: string
  tagline?: string
  summary?: string
  description?: string
  category?: Product["category"]
  featured?: boolean
  releaseStatus?: Product["releaseStatus"]
  colors?: string[]
  image?: string
  accent?: string
  priceAmount?: number
  currency?: string
  stock?: number
  lowStockThreshold?: number
}

/** Minimal input to create a product; rich marketing content defaults to empty. */
export interface NewProductInput {
  name: string
  category: Product["category"]
  priceAmount: number
  currency?: string
  tagline?: string
  summary?: string
  description?: string
  image?: string
  accent?: string
  featured?: boolean
  releaseStatus?: Product["releaseStatus"]
  colors?: string[]
  stock?: number
  lowStockThreshold?: number
}

export interface SaleLine {
  slug: string
  quantity: number
}

export type SaleResult = { ok: true; map: ProductMap } | { ok: false; error: string }

const DEFAULT_ACCENT = "#9ca3af"
const DEFAULT_IMAGE = "/placeholder.svg"

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Ensure a unique slug within the current map by suffixing -2, -3, … */
export function uniqueSlug(base: string, map: ProductMap): string {
  let slug = base || "product"
  let n = 2
  while (map[slug]) slug = `${base}-${n++}`
  return slug
}

// --- Browser IO -------------------------------------------------------------

export function readStoredCatalog(): ProductMap | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    // Re-parse each record through the schema so persisted data that predates a
    // field (e.g. added inventory) is upgraded via defaults instead of trusted blindly.
    const map: ProductMap = {}
    for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
      const result = productSchema.safeParse(value)
      if (result.success) map[slug] = result.data
    }
    return map
  } catch {
    return null
  }
}

export function writeStoredCatalog(map: ProductMap): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // Quota or serialization failure is non-fatal; the in-memory state still holds.
  }
}

// --- Pure map operations ----------------------------------------------------

export function toMap(products: Product[]): ProductMap {
  const map: ProductMap = {}
  for (const p of products) map[p.slug] = p
  return map
}

/**
 * Merge the server seed with any locally-persisted catalog. Persisted records
 * win (they carry admin edits), and seed products missing locally are added so
 * newly-shipped catalog entries appear without wiping local state.
 */
export function mergeSeed(seed: Product[], stored: ProductMap | null): ProductMap {
  if (!stored) return toMap(seed)
  const merged: ProductMap = { ...stored }
  for (const p of seed) if (!merged[p.slug]) merged[p.slug] = p
  return merged
}

export function buildProduct(input: NewProductInput, map: ProductMap): Product {
  const slug = uniqueSlug(slugify(input.name), map)
  const image = input.image?.trim() || DEFAULT_IMAGE
  const accent = input.accent?.trim() || DEFAULT_ACCENT
  const draft: Product = {
    slug,
    name: input.name,
    tagline: input.tagline ?? "",
    category: input.category,
    price: { amount: input.priceAmount, currency: input.currency ?? "USD" },
    summary: input.summary ?? "",
    description: input.description ?? "",
    image,
    accent,
    featured: input.featured ?? false,
    releaseStatus: input.releaseStatus ?? "available",
    hero: {
      kind: "parallax",
      image,
      accent,
      motion: "rise",
      scrollVh: 200,
      intro: { kicker: "Introducing", title: input.name, subtitle: input.tagline ?? "" },
      beats: [],
    },
    features: [],
    specs: [],
    colors: input.colors ?? [],
    stock: input.stock ?? 0,
    lowStockThreshold: input.lowStockThreshold ?? 5,
    reserved: 0,
  }
  return productSchema.parse(draft)
}

export function applyPatch(product: Product, patch: ProductPatch): Product {
  const next: Product = {
    ...product,
    name: patch.name ?? product.name,
    tagline: patch.tagline ?? product.tagline,
    summary: patch.summary ?? product.summary,
    description: patch.description ?? product.description,
    category: patch.category ?? product.category,
    featured: patch.featured ?? product.featured,
    releaseStatus: patch.releaseStatus ?? product.releaseStatus,
    colors: patch.colors ?? product.colors,
    image: patch.image ?? product.image,
    accent: patch.accent ?? product.accent,
    price: {
      amount: patch.priceAmount ?? product.price.amount,
      currency: patch.currency ?? product.price.currency,
    },
    stock: patch.stock ?? product.stock,
    lowStockThreshold: patch.lowStockThreshold ?? product.lowStockThreshold,
  }
  return productSchema.parse(next)
}

/**
 * Apply a sale to the map, decrementing available stock. Guards oversell for
 * physical products (pre-orders sell without decrementing physical stock).
 * Returns a discriminated result so the caller can surface a friendly error.
 */
export function recordSale(map: ProductMap, lines: SaleLine[]): SaleResult {
  const next: ProductMap = { ...map }
  for (const line of lines) {
    if (line.quantity <= 0) continue
    const product = next[line.slug]
    if (!product) continue // unknown slug (e.g. legacy cart item) — skip stock accounting
    if (product.releaseStatus === "preorder") continue
    if (product.releaseStatus === "coming-soon") {
      return { ok: false, error: `${product.name} is not available for purchase yet.` }
    }
    const available = effectiveStock(product)
    if (available < line.quantity) {
      return {
        ok: false,
        error:
          available <= 0
            ? `${product.name} is sold out.`
            : `Only ${available} of ${product.name} left — please reduce the quantity.`,
      }
    }
    next[line.slug] = { ...product, stock: product.stock - line.quantity }
  }
  return { ok: true, map: next }
}
