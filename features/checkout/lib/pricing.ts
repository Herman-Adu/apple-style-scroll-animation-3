// Pure checkout pricing engine.
//
// Turns a set of order items plus a customer's personal offer tags into a priced
// quote with an itemized discount breakdown. This is the single source of truth
// for offer math: the client calls it for instant display, and the server action
// (actions.ts) calls the exact same function after rebuilding prices from the
// authoritative catalog — so what the customer sees always matches what is
// charged and recorded. No I/O here; keep it deterministic and testable.

import type { OfferTag } from "@/lib/auth/types"
import type { AppliedOffer, OrderItem } from "@/lib/orders/types"

const MAX_PERCENT = 100

/** A fully-priced checkout, ready to display and to persist on an Order. */
export interface PricedQuote {
  items: OrderItem[]
  subtotal: number
  /** Total savings across all applied offers, capped at the subtotal. */
  discount: number
  /** Offers that were applied, with their individual monetary effect. */
  appliedOffers: AppliedOffer[]
  shipping: number
  total: number
  currency: string
}

/** Round to 2 decimal places to keep money math clean. */
function money(value: number): number {
  return Math.round(value * 100) / 100
}

function clampPercent(value: number | undefined): number {
  return Math.min(Math.max(value ?? 0, 0), MAX_PERCENT)
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Whether an offer is still valid at `now`. An offer with no `expiresAt` never
 * expires; an unparseable date is treated as active (fail-open on display, since
 * the value is admin-controlled). This is the guard the checkout uses so an
 * expired offer can never discount an order.
 */
export function isOfferActive(offer: OfferTag, now: number = Date.now()): boolean {
  if (!offer.expiresAt) return true
  const expiry = new Date(offer.expiresAt).getTime()
  if (Number.isNaN(expiry)) return true
  return expiry > now
}

/**
 * Whole days remaining before an offer expires. Returns `null` when the offer
 * never expires, `0` on the final day, and a negative number once expired.
 */
export function offerDaysLeft(offer: OfferTag, now: number = Date.now()): number | null {
  if (!offer.expiresAt) return null
  const expiry = new Date(offer.expiresAt).getTime()
  if (Number.isNaN(expiry)) return null
  return Math.ceil((expiry - now) / DAY_MS)
}

/**
 * Price a checkout for a customer.
 *
 * Offer rules (deliberately conservative so offers can never produce a negative
 * or runaway charge):
 * - `percent`: only the single best percent offer applies — percent offers do
 *   NOT stack. Clamped to 0–100.
 * - `shipping`: waives the shipping fee (records the waived amount).
 * - `custom`: label-only, no monetary effect — surfaced for transparency.
 * The combined discount can never exceed the subtotal.
 */
export function priceCheckout({
  items,
  offers,
  shipping = 0,
  now = Date.now(),
}: {
  items: OrderItem[]
  offers: OfferTag[]
  shipping?: number
  /** Evaluation time for expiry checks. Injectable for deterministic tests. */
  now?: number
}): PricedQuote {
  const currency = items[0]?.currency ?? "USD"
  const subtotal = money(items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0))

  // Expired offers are dropped before any math runs — the checkout can never
  // honour an offer past its expiry, on the client or the authoritative server.
  const active = offers.filter((offer) => isOfferActive(offer, now))

  const appliedOffers: AppliedOffer[] = []
  let discount = 0

  // Best single percent offer (no stacking).
  const bestPercent = active
    .filter((offer) => offer.kind === "percent" && clampPercent(offer.value) > 0)
    .reduce<OfferTag | null>((best, offer) => {
      if (!best || clampPercent(offer.value) > clampPercent(best.value)) return offer
      return best
    }, null)

  if (bestPercent) {
    const pct = clampPercent(bestPercent.value)
    const amount = money((subtotal * pct) / 100)
    discount += amount
    appliedOffers.push({ id: bestPercent.id, label: bestPercent.label, kind: "percent", amount })
  }

  // Shipping waiver.
  let resolvedShipping = shipping
  const shippingOffer = active.find((offer) => offer.kind === "shipping")
  if (shippingOffer) {
    const waived = resolvedShipping
    resolvedShipping = 0
    appliedOffers.push({ id: shippingOffer.id, label: shippingOffer.label, kind: "shipping", amount: waived })
  }

  // Custom offers are label-only.
  for (const offer of active.filter((offer) => offer.kind === "custom")) {
    appliedOffers.push({ id: offer.id, label: offer.label, kind: "custom", amount: 0 })
  }

  discount = Math.min(money(discount), subtotal)
  const total = money(Math.max(0, subtotal - discount) + resolvedShipping)

  return { items, subtotal, discount, appliedOffers, shipping: resolvedShipping, total, currency }
}
