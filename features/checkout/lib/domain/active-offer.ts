// Shared, client-safe helpers for surfacing a customer's personal offer in the
// UI (banner, products page, cart). These describe an offer for display; the
// checkout pricing engine (features/checkout/lib/pricing) remains the single
// source of truth for the actual money math. Kept pure so any client component
// can reuse it without duplicating the selection/urgency logic.

import { isOfferActive, offerDaysLeft } from "@/features/checkout/lib/domain/pricing"
import type { OfferTag } from "@/lib/auth/domain/types"

/** Headline describing an offer's benefit, e.g. "15% off" or "Free shipping". */
export function offerHeadline(offer: OfferTag): string {
  switch (offer.kind) {
    case "percent":
      return `${offer.value ?? 0}% off`
    case "shipping":
      return "Free shipping"
    default:
      return offer.label
  }
}

/** Gentle urgency copy from the days remaining, or null when the offer never expires. */
export function offerUrgency(offer: OfferTag): string | null {
  const days = offerDaysLeft(offer)
  if (days === null) return null
  if (days <= 0) return "ends today"
  if (days === 1) return "ends tomorrow"
  return `${days} days left`
}

/**
 * Prefer the best percent offer (matches the checkout's no-stacking rule), then
 * any active offer, so callers advertise exactly what the customer will get.
 */
export function pickActiveOffer(offers: OfferTag[]): OfferTag | null {
  const active = offers.filter((o) => isOfferActive(o))
  if (active.length === 0) return null
  const percents = active.filter((o) => o.kind === "percent" && (o.value ?? 0) > 0)
  if (percents.length > 0) {
    return percents.reduce((best, o) => ((o.value ?? 0) > (best.value ?? 0) ? o : best))
  }
  return active[0]
}
