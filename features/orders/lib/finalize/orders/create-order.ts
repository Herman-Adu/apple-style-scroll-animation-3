import "server-only";

import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { orderSelect } from "./order-row";
import { nextOrderNumber } from "./order-number";

export async function createOrderForSession(
  session: Stripe.Checkout.Session,
  pendingId: string,
) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.pendingCheckout.updateMany({
      where: { id: pendingId, status: "reserved" },
      data: { status: "completed" },
    });
    if (claimed.count === 0) return null;

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

export function isSessionAlreadyFinalizedError(err: unknown): boolean {
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

export async function markOffersRedeemedFor(
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
