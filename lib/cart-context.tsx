"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { CartLine, Product } from "@/lib/types"

interface CartContextValue {
  lines: CartLine[]
  isOpen: boolean
  itemCount: number
  subtotal: number
  currency: string
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, color: string, quantity?: number) => void
  removeItem: (slug: string, color: string) => void
  updateQuantity: (slug: string, color: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = "momo-cart-v1"

interface StoredLine {
  slug: string
  color: string
  quantity: number
}

export function CartProvider({
  children,
  catalog,
}: {
  children: React.ReactNode
  /** Product catalog used to rehydrate stored cart lines. */
  catalog: Product[]
}) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Rehydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored: StoredLine[] = JSON.parse(raw)
        const restored: CartLine[] = stored
          .map((line) => {
            const product = catalog.find((item) => item.slug === line.slug)
            if (!product) return null
            return { product, color: line.color, quantity: line.quantity }
          })
          .filter((line): line is CartLine => line !== null)
        setLines(restored)
      }
    } catch {
      // Ignore malformed storage.
    }
    setHydrated(true)
  }, [catalog])

  // Persist whenever the cart changes (after hydration).
  useEffect(() => {
    if (!hydrated) return
    const stored: StoredLine[] = lines.map(({ product, color, quantity }) => ({
      slug: product.slug,
      color,
      quantity,
    }))
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }, [lines, hydrated])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback((product: Product, color: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.product.slug === product.slug && line.color === color)
      if (existing) {
        return prev.map((line) =>
          line.product.slug === product.slug && line.color === color
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        )
      }
      return [...prev, { product, color, quantity }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((slug: string, color: string) => {
    setLines((prev) => prev.filter((line) => !(line.product.slug === slug && line.color === color)))
  }, [])

  const updateQuantity = useCallback((slug: string, color: string, quantity: number) => {
    setLines((prev) =>
      prev
        .map((line) =>
          line.product.slug === slug && line.color === color ? { ...line, quantity } : line,
        )
        .filter((line) => line.quantity > 0),
    )
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])
  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.price.amount * line.quantity, 0),
    [lines],
  )
  const currency = lines[0]?.product.price.currency ?? "USD"

  const value: CartContextValue = {
    lines,
    isOpen,
    itemCount,
    subtotal,
    currency,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
