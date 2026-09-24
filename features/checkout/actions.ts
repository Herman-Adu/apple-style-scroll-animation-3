"use server"

// Server-authoritative checkout pricing.
//
// The client sends only *references* — which product, which colour, how many —
// plus the customer's offer tags. The server rebuilds every line price from the
// authoritative catalog (never trusting a client-sent amount), clamps the
// quantity, and recomputes the discount with the same pure engine the UI uses.
// The returned quote is what gets persisted on the order, so prices cannot be
// tampered with from the browser. When the auth store moves server-side (Strapi),
// offers will be re-read here too; the shape and callers stay identical.

import { products } from "@/lib/data/products"
import type { OfferTag } from "@/lib/auth/types"
import type { OrderItem } from "@/lib/orders/types"
import { priceCheckout, type PricedQuote } from "./lib/pricing"

/** Max units per line — a coarse abuse guard on the aggregate quantity. */
const MAX_QTY_PER_LINE = 20

export interface QuoteRequestLine {
  slug: string
  color?: string
  quantity: number
}

export interface QuoteRequest {
  lines: QuoteRequestLine[]
  offers: OfferTag[]
}

export async function quoteCheckout({ lines, offers }: QuoteRequest): Promise<PricedQuote> {
  const items: OrderItem[] = []

  for (const line of lines) {
    const product = products.find((candidate) => candidate.slug === line.slug)
    if (!product) continue // silently drop unknown/removed products

    const quantity = Math.min(Math.max(Math.floor(line.quantity), 1), MAX_QTY_PER_LINE)

    items.push({
      slug: product.slug,
      name: product.name,
      image: product.image,
      color: line.color,
      quantity,
      // Authoritative price — the browser cannot influence this.
      unitAmount: product.price.amount,
      currency: product.price.currency,
    })
  }

  return priceCheckout({ items, offers: offers ?? [] })
}
