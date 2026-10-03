import "server-only";

import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { incrementDiscountCodeRedemption } from "@/features/discount-codes/actions";
import type { AppliedOffer, Order } from "../types";
import { orderSelect, toOrder } from "./order-row";
import { nextOrderNumber } from "./order-number";

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

/** True when a Prisma unique-constraint error (P2002) was on stripeSessionId. */
function isSessionAlreadyFinalizedError(err: unknown): boolean {
  const e = err as { code?: string; meta?: { target?: unknown } } | null;
  if (!e || e.code !== "P2002") return false;
  const target = e.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : target
      ? [String(target)]
      : [];
  return fields.some(
    (f) =>
      f === "stripe_session_id" ||
      f === "stripeSessionId" ||
      f.includes("stripe_session_id"),
  );
}

async function createOrderForSession(
  session: Stripe.Checkout.Session,
  pendingId: string,
) {
  return prisma.$transaction(async (tx) => {
    // Atomically CLAIM the pending row (reserved -> completed) before doing any
    // work. A concurrent finalizer (webhook vs. return page) blocks on this row
    // lock until we commit, then matches 0 rows and bails out. This is what makes
    // finalization truly idempotent under concurrency; a plain read-then-write
    // lets both callers see "reserved". If anything below throws, the whole
    // transaction (including this claim) rolls back.
    const claimed = await tx.pendingCheckout.updateMany({
      where: { id: pendingId, status: "reserved" },
      data: { status: "completed" },
    });
    if (claimed.count === 0) return null; // already finalized or released

    const pending = await tx.pendingCheckout.findUniqueOrThrow({
      where: { id: pendingId },
    });

    const number = await nextOrderNumber(tx);
    const row = await tx.order.create({
      data: {
        id: crypto.randomUUID(),
        number,
        userId: pending.userId,
        email: pending.email,
        status: "processing",
        items: pending.items as Prisma.InputJsonValue,
        subtotal: pending.subtotal,
        shipping: pending.shipping,
        discount: pending.discount,
        appliedOffers: pending.appliedOffers as Prisma.InputJsonValue,
        discountCode: pending.discountCode ?? null,
        total: pending.total,
        currency: pending.currency,
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      },
      select: orderSelect,
    });
    return row;
  });
}

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

/** Stamp redeemed offers on a user by explicit id (the webhook has no session).
 * Record-only, mirroring markOffersRedeemedAction — never disables an offer. */
async function markOffersRedeemedFor(
  userId: string,
  offerIds: string[],
): Promise<void> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { offers: true },
  });
  const existing = Array.isArray(current?.offers)
    ? (current!.offers as unknown as {
        id: string;
        redeemedAt?: string;
        redemptionCount?: number;
      }[])
    : [];
  const target = new Set(offerIds);
  const now = new Date().toISOString();
  const offers = existing.map((offer) =>
    target.has(offer.id)
      ? {
          ...offer,
          redeemedAt: now,
          redemptionCount: (offer.redemptionCount ?? 0) + 1,
        }
      : offer,
  );
  await prisma.user.update({
    where: { id: userId },
    data: { offers: offers as unknown as Prisma.InputJsonValue },
  });
}
