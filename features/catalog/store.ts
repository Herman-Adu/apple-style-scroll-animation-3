// Catalog store — pure map logic shared across the app.
//
// This module is persistence-free: the catalog lives in Neon (seed + admin
// overlay) via `lib/catalog/db-actions.ts`, and the React provider in
// `catalog-context.tsx` reads/writes through those server actions. What remains
// here are the pure, side-effect-free operations over a ProductMap — slug
// helpers, product construction, patching, and sale/stock accounting — reused
// by both the client provider and the server actions so the rules live in one
// place. These shapes are also the contract the eventual Strapi migration maps
// onto 1:1.

import type { Product } from "@/features/products"
import { productSchema } from "@/features/products"
import { effectiveStock } from "@/features/products"

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

// --- Pure map operations ----------------------------------------------------

export function toMap(products: Product[]): ProductMap {
  const map: ProductMap = {}
  for (const p of products) map[p.slug] = p
  return map
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
