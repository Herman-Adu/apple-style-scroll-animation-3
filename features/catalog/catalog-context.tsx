"use client"

// Client overlay over the server catalog. Seeded from server-rendered products
// (so the first client render matches SSR — no hydration mismatch), then merged
// with the locally-persisted catalog after mount. Admin mutations write through
// here and persist; the storefront reads live product state from here so stock
// and CRUD changes reflect immediately, including across tabs.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Product } from "@/features/products"
import {
  applyPatch,
  buildProduct,
  CATALOG_STORAGE_KEY,
  mergeSeed,
  readStoredCatalog,
  recordSale,
  toMap,
  writeStoredCatalog,
  type NewProductInput,
  type ProductMap,
  type ProductPatch,
  type SaleLine,
} from "./store"

interface CatalogContextValue {
  /** Live catalog, stable-sorted (featured first, then name). */
  products: Product[]
  getProduct: (slug: string) => Product | undefined
  createProduct: (input: NewProductInput) => Product
  updateProduct: (slug: string, patch: ProductPatch) => void
  deleteProduct: (slug: string) => void
  adjustStock: (slug: string, delta: number) => void
  setStock: (slug: string, value: number) => void
  /** Apply a completed sale, decrementing stock. Returns an error string on oversell. */
  recordSale: (lines: SaleLine[]) => { ok: boolean; error?: string }
  /** Discard local edits and return to the server seed. */
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

  // After mount, merge in the persisted overlay.
  useEffect(() => {
    setMap(mergeSeed(seed, readStoredCatalog()))
  }, [seed])

  // Cross-tab sync: pick up writes made by the admin in another tab.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CATALOG_STORAGE_KEY) return
      setMap(mergeSeed(seed, readStoredCatalog()))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [seed])

  // Persist + update state in one place so every mutation stays consistent.
  const commit = useCallback((next: ProductMap) => {
    writeStoredCatalog(next)
    setMap(next)
  }, [])

  const createProduct = useCallback(
    (input: NewProductInput) => {
      const product = buildProduct(input, map)
      commit({ ...map, [product.slug]: product })
      return product
    },
    [map, commit],
  )

  const updateProduct = useCallback(
    (slug: string, patch: ProductPatch) => {
      const current = map[slug]
      if (!current) return
      commit({ ...map, [slug]: applyPatch(current, patch) })
    },
    [map, commit],
  )

  const deleteProduct = useCallback(
    (slug: string) => {
      if (!map[slug]) return
      const next = { ...map }
      delete next[slug]
      commit(next)
    },
    [map, commit],
  )

  const adjustStock = useCallback(
    (slug: string, delta: number) => {
      const current = map[slug]
      if (!current) return
      const stock = Math.max(0, current.stock + delta)
      commit({ ...map, [slug]: { ...current, stock } })
    },
    [map, commit],
  )

  const setStock = useCallback(
    (slug: string, value: number) => {
      const current = map[slug]
      if (!current) return
      const stock = Math.max(0, Math.floor(value) || 0)
      commit({ ...map, [slug]: { ...current, stock } })
    },
    [map, commit],
  )

  const applySale = useCallback(
    (lines: SaleLine[]) => {
      const result = recordSale(map, lines)
      if (!result.ok) return { ok: false, error: result.error }
      commit(result.map)
      return { ok: true }
    },
    [map, commit],
  )

  const resetToSeed = useCallback(() => {
    commit(toMap(seed))
  }, [seed, commit])

  const value = useMemo<CatalogContextValue>(
    () => ({
      products: sortProducts(map),
      getProduct: (slug) => map[slug],
      createProduct,
      updateProduct,
      deleteProduct,
      adjustStock,
      setStock,
      recordSale: applySale,
      resetToSeed,
    }),
    [map, createProduct, updateProduct, deleteProduct, adjustStock, setStock, applySale, resetToSeed],
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
