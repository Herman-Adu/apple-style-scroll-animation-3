import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { incrementDiscountCodeRedemption } from "@/features/discount-codes/actions";
import type { AppliedOffer, Order } from "../types";
import { orderSelect, toOrder } from "./order-row";
import {
  createOrderForSession,
  isSessionAlreadyFinalizedError,
  markOffersRedeemedFor,
} from "./create-order";

/**
 * Finalize a paid Stripe Checkout Session into a real Order. The stock was
 * already reserved at session creation, so this does NOT decrement again — it
 * just materializes the order and marks the pending row completed.
 *
 * Idempotent: guarded by the pending row's `reserved` status and the unique
 * `Order.stripeSessionId`, so a re-delivered `checkout.session.completed` event
 * is a safe no-op. Returns the created Order, or null if nothing was pending.
 */
export async function finalizeCheckout(
  session: Stripe.Checkout.Session,
): Promise<Order | null> {
  const pendingId = session.metadata?.pendingCheckoutId;
  if (!pendingId) return null;

  let created: Awaited<ReturnType<typeof createOrderForSession>>;
  try {
    created = await createOrderForSession(session, pendingId);
  } catch (err) {
    // The webhook and the checkout-return page can finalize the same session at
    // the same moment. Both see the pending row as "reserved"; the loser hits the
    // unique Order.stripeSessionId. The winner already created the order (and
    // sends its emails), so treat the loser as an already-finalized no-op. The
    // loser's transaction rolled back, so no stock or order number is consumed.
    if (isSessionAlreadyFinalizedError(err)) return null;
    throw err;
  }

  if (!created) return null;

  // Record which personal offers were used (best-effort; never blocks the order).
  const offerIds = (
    Array.isArray(created.appliedOffers)
      ? (created.appliedOffers as unknown as AppliedOffer[])
      : []
  )
    .map((o) => o.id)
    .filter(Boolean);
  if (offerIds.length > 0) {
    void markOffersRedeemedFor(created.userId, offerIds).catch(() => {});
  }
  if (created.discountCode) {
    void incrementDiscountCodeRedemption(created.discountCode).catch(() => {});
  }

  return toOrder(created);
}

// helpers moved to ./create-order

/** The order already finalized for a Stripe session, if any. Lets the return
 * page show the confirmed order number when the webhook created it first
 * (and lets both paths stay idempotent). */
export async function getOrderByStripeSession(
  sessionId: string,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: orderSelect,
  });
  return row ? toOrder(row) : null;
}

// helpers moved to ./create-order
