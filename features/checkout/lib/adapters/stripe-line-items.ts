// Pure translation from our authoritative PricedQuote into Stripe Checkout
// line items. Kept free of I/O and the "use server" boundary so it can be unit
// tested directly and reused by the checkout action. Money in this app is stored
// in major units (e.g. 349 = £349.00); Stripe wants integer minor units.

import type Stripe from "stripe";
import type { PricedQuote } from "../domain/pricing";

/** Convert a major-unit amount (349, 9.99) to Stripe minor units (34900, 999).
 * Note: assumes a 2-decimal currency (GBP/USD/EUR), which is what this store
 * uses. Zero-decimal currencies (e.g. JPY) would need a different factor. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Turn a possibly-relative catalog image path into the absolute HTTPS URL
 * Stripe requires. Stripe fetches product images from its own servers, so a
 * relative path (`/products/x.png`) is rejected and breaks the Checkout Session
 * — only include an image when we can make it absolute from a known origin.
 * Already-absolute URLs (http/https) are passed through untouched. */
function absoluteImageUrl(
  image: string | undefined,
  origin: string | undefined,
): string | undefined {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  if (!origin) return undefined;
  if (
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
      origin.replace(/\/$/, ""),
    )
  ) {
    return undefined;
  }
  return `${origin.replace(/\/$/, "")}${image.startsWith("/") ? "" : "/"}${image}`;
}

/** Build itemized Stripe line items from a priced quote. When an `origin` is
 * provided, each line includes the product's image (made absolute) so it shows
 * in Checkout; without an origin, images are omitted (a relative URL would
 * break the session). The order-level discount and shipping are applied by the
 * caller (coupon + shipping_options), not as line items, since Stripe has no
 * negative lines. */
export function buildStripeLineItems(
  quote: PricedQuote,
  options?: { origin?: string },
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const currency = quote.currency.toLowerCase();
  return quote.items
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const image = absoluteImageUrl(item.image, options?.origin);
      return {
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: toMinorUnits(item.unitAmount),
          product_data: {
            name: item.color ? `${item.name} — ${item.color}` : item.name,
            ...(image ? { images: [image] } : {}),
          },
        },
      };
    });
}
