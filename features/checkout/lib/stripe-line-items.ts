// Pure translation from our authoritative PricedQuote into Stripe Checkout
// line items. Kept free of I/O and the "use server" boundary so it can be unit
// tested directly and reused by the checkout action. Money in this app is stored
// in major units (e.g. 349 = £349.00); Stripe wants integer minor units.

import type Stripe from "stripe"
import type { PricedQuote } from "./pricing"

/** Convert a major-unit amount (349, 9.99) to Stripe minor units (34900, 999).
 * Note: assumes a 2-decimal currency (GBP/USD/EUR), which is what this store
 * uses. Zero-decimal currencies (e.g. JPY) would need a different factor. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

/** Build itemized Stripe line items from a priced quote. Images are deliberately
 * omitted — relative image URLs break the Checkout Session in this runtime. The
 * order-level discount and shipping are applied by the caller (coupon +
 * shipping_options), not as line items, since Stripe has no negative lines. */
export function buildStripeLineItems(
  quote: PricedQuote,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const currency = quote.currency.toLowerCase()
  return quote.items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toMinorUnits(item.unitAmount),
        product_data: {
          name: item.color ? `${item.name} — ${item.color}` : item.name,
        },
      },
    }))
}
