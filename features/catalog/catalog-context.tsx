"use client"

// Client overlay over the server catalog. Seeded from server-rendered products
// (so the first client render matches SSR — no hydration mismatch), then, after
// mount, reconciled with the authoritative catalog in Neon (seed + admin
// overlay). Admin mutations update the local map optimistically for instant
// feedback and write through to Neon via server actions; the DB is the source
// of truth, so a re-fetch after each write reconciles any divergence and other
// sessions see the change on their next load.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Product } from "@/features/products"
import {
  applyPatch,
  buildProduct,
  toMap,
  type NewProductInput,
  type ProductMap,
  type ProductPatch,
  type SaleLine,
} from "./store"
import {
  deleteProductOverlayAction,
  getCatalogProducts,
  resetCatalogOverlayAction,
  saveProductOverlayAction,
} from "@/lib/catalog/db-actions"

interface CatalogContextValue {
  /** Live catalog, stable-sorted (featured first, then name). */
  products: Product[]
  getProduct: (slug: string) => Product | undefined
  createProduct: (input: NewProductInput) => Product
  updateProduct: (slug: string, patch: ProductPatch) => void
  deleteProduct: (slug: string) => void
  adjustStock: (slug: string, delta: number) => void
  setStock: (slug: string, value: number) => void
  /** Discard all admin edits and return to the code seed. */
  resetToSeed: () => void
}

const CatalogContext = createContext<CatalogContextValue | null>(null)

function sortProducts(map: ProductMap): Product[] {
  return Object.values(map).sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export function CatalogProvider({
  initialProducts,
  children,
}: {
  initialProducts: Product[]
  children: React.ReactNode
}) {
  const seed = useMemo(() => initialProducts, [initialProducts])
  // First render uses the seed only, matching the server output exactly.
  const [map, setMap] = useState<ProductMap>(() => toMap(seed))

  // Reconcile with the authoritative catalog (seed + admin overlay) in Neon.
  const refresh = useCallback(async () => {
    try {
      const products = await getCatalogProducts()
      setMap(toMap(products))
    } catch {
      // Network/DB hiccup is non-fatal; the current in-memory state still holds.
    }
  }, [])

  // After mount, pull the live catalog from the server (replaces the SSR seed).
  useEffect(() => {
    void refresh()
  }, [refresh])

  const createProduct = useCallback(
    (input: NewProductInput) => {
      const product = buildProduct(input, map)
      setMap({ ...map, [product.slug]: product }) // optimistic
      void saveProductOverlayAction(product).then(refresh, refresh)
      return product
    },
    [map, refresh],
  )

  const updateProduct = useCallback(
    (slug: string, patch: ProductPatch) => {
      const current = map[slug]
      if (!current) return
      const next = applyPatch(current, patch)
      setMap({ ...map, [slug]: next })
      void saveProductOverlayAction(next).then(refresh, refresh)
    },
    [map, refresh],
  )

  const deleteProduct = useCallback(
    (slug: string) => {
      if (!map[slug]) return
      const next = { ...map }
      delete next[slug]
      setMap(next)
      void deleteProductOverlayAction(slug).then(refresh, refresh)
    },
    [map, refresh],
  )

  const adjustStock = useCallback(
    (slug: string, delta: number) => {
      const current = map[slug]
      if (!current) return
      const stock = Math.max(0, current.stock + delta)
      const next = { ...current, stock }
      setMap({ ...map, [slug]: next })
      void saveProductOverlayAction(next).then(refresh, refresh)
    },
    [map, refresh],
  )

  const setStock = useCallback(
    (slug: string, value: number) => {
      const current = map[slug]
      if (!current) return
      const stock = Math.max(0, Math.floor(value) || 0)
      const next = { ...current, stock }
      setMap({ ...map, [slug]: next })
      void saveProductOverlayAction(next).then(refresh, refresh)
    },
    [map, refresh],
  )

  const resetToSeed = useCallback(() => {
    setMap(toMap(seed))
    void resetCatalogOverlayAction().then(refresh, refresh)
  }, [seed, refresh])

  const value = useMemo<CatalogContextValue>(
    () => ({
      products: sortProducts(map),
      getProduct: (slug) => map[slug],
      createProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      setStock,
      resetToSeed,
    }),
    [map, createProduct, updateProduct, deleteProduct, adjustStock, setStock, resetToSeed],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error("useCatalog must be used within a CatalogProvider")
  return ctx
}

/**
 * Read a single live product by slug. Pass the server-rendered product as
 * `fallback` so client islands render correct data before the provider mounts
 * and while SSR output is being hydrated.
 */
export function useProduct(slug: string, fallback?: Product): Product | undefined {
  const ctx = useContext(CatalogContext)
  if (!ctx) return fallback
  return ctx.getProduct(slug) ?? fallback
}
