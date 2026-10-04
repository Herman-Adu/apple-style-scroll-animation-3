import "server-only";

import type Stripe from "stripe";

import { prisma } from "@/lib/db/prisma";
import { incrementDiscountCodeRedemption } from "@/features/discount-codes";
import type { AppliedOffer, Order } from "../../../domain/types";
import { orderSelect, toOrder } from "../../../domain/order-row";
import {
  createOrderForSession,
  isSessionAlreadyFinalizedError,
  markOffersRedeemedFor,
} from "./create-order";

/**
 * Finalize a paid Stripe Checkout Session into a real Order. The stock was
 * already reserved at session creation, so this does NOT decrement again — it
 * just materializes the order and marks the pending row completed.
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
    if (isSessionAlreadyFinalizedError(err)) return null;
    throw err;
  }

  if (!created) return null;

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

export async function getOrderByStripeSession(
  sessionId: string,
): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: orderSelect,
  });
  return row ? toOrder(row) : null;
}
