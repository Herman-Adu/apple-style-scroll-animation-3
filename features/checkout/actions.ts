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

import { headers } from "next/headers"
import type Stripe from "stripe"

import { products } from "@/lib/data/products"
import type { OfferTag } from "@/lib/auth/types"
import type { OrderItem } from "@/lib/orders/types"
import { prisma } from "@/lib/db/prisma"
import { env } from "@/lib/env"
import { stripe } from "@/lib/stripe/server"
import { getServerSession } from "@/lib/auth/server"
import { commitStock, releaseReservationById } from "@/lib/orders/checkout-finalize"
import { priceCheckout, type PricedQuote } from "./lib/pricing"
import { buildStripeLineItems, toMinorUnits } from "./lib/stripe-line-items"

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

/** Absolute origin for building Stripe's return_url. Prefers the real request
 * host (works in preview + prod), falling back to the configured site URL. */
async function resolveOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https")
    return `${proto}://${host}`
  }
  return env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
}

/**
 * Start an embedded Stripe Checkout for the signed-in customer and return its
 * client secret. This is the authoritative money path:
 *
 *  1. Identity comes from the Better Auth session — never the client.
 *  2. Prices + offer discounts are rebuilt server-side from the catalog, so the
 *     browser cannot influence what's charged.
 *  3. Stock is reserved (decremented) in the same transaction that records a
 *     `PendingCheckout`, enforcing the oversell guard up front — we never take a
 *     payment we can't fulfil. The order itself is created later, from the
 *     webhook/return once Stripe confirms payment.
 *  4. If Stripe session creation fails after reserving, the reservation is
 *     released so stock isn't stranded.
 */
export async function startStripeCheckout({
  lines,
}: {
  lines: QuoteRequestLine[]
}): Promise<{ clientSecret: string }> {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Payments are not configured.")

  const session = await getServerSession()
  if (!session) throw new Error("Please sign in to check out.")
  const userId = session.sub
  const email = session.email

  // Authoritative offers for this user, read from the DB (not the client).
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { offers: true },
  })
  const offers = (Array.isArray(userRow?.offers) ? userRow.offers : []) as unknown as OfferTag[]

  const priced = await quoteCheckout({ lines, offers })
  if (priced.items.length === 0) throw new Error("Your cart is empty.")

  // Reserve stock + persist the pending checkout atomically. The oversell guard
  // lives in commitStock and rolls the whole thing back on failure.
  const pendingId = crypto.randomUUID()
  await prisma.$transaction(async (tx) => {
    const reserved = await commitStock(
      tx,
      priced.items.map((item) => ({ slug: item.slug, quantity: item.quantity })),
    )
    await tx.pendingCheckout.create({
      data: {
        id: pendingId,
        userId,
        email,
        items: priced.items as unknown as object,
        appliedOffers: priced.appliedOffers as unknown as object,
        reservedStock: reserved as unknown as object,
        subtotal: priced.subtotal,
        shipping: priced.shipping,
        discount: priced.discount,
        total: priced.total,
        currency: priced.currency,
        status: "reserved",
      },
    })
  })

  try {
    const origin = await resolveOrigin()
    const currency = priced.currency.toLowerCase()

    // Order-level offer savings become a one-time coupon (Stripe has no negative
    // line items). Shipping, when charged, is a fixed shipping rate.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
    if (priced.discount > 0) {
      const label =
        priced.appliedOffers
          .filter((offer) => offer.amount > 0)
          .map((offer) => offer.label)
          .join(", ") || "Offer discount"
      const coupon = await stripe.coupons.create({
        amount_off: toMinorUnits(priced.discount),
        currency,
        duration: "once",
        name: label.slice(0, 40),
      })
      discounts = [{ coupon: coupon.id }]
    }

    const shipping_options: Stripe.Checkout.SessionCreateParams.ShippingOption[] | undefined =
      priced.shipping > 0
        ? [
            {
              shipping_rate_data: {
                type: "fixed_amount",
                fixed_amount: { amount: toMinorUnits(priced.shipping), currency },
                display_name: "Shipping",
              },
            },
          ]
        : undefined

    const checkout = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      line_items: buildStripeLineItems(priced, { origin }),
      discounts,
      shipping_options,
      customer_email: email || undefined,
      return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: { pendingCheckoutId: pendingId },
      payment_intent_data: { metadata: { pendingCheckoutId: pendingId } },
    })

    if (!checkout.client_secret) throw new Error("Stripe did not return a client secret.")
    await prisma.pendingCheckout.update({
      where: { id: pendingId },
      data: { stripeSessionId: checkout.id },
    })
    return { clientSecret: checkout.client_secret }
  } catch (err) {
    // Roll back the stock we reserved so an abandoned attempt strands nothing.
    await releaseReservationById(pendingId).catch(() => {})
    throw err
  }
}
