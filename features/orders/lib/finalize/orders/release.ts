import "server-only";

import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { revalidateCatalog } from "@/features/catalog/server";
import type { Order } from "../../types";
import { orderSelect, toOrder } from "./order-row";
import {
  restoreStock,
  toReserved,
  type ReservedLine,
} from "../stock/restore-stock";

export async function releaseCheckout(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const pendingId = session.metadata?.pendingCheckoutId;
  if (!pendingId) return;
  await releaseReservationById(pendingId);
}

export async function reconcileRefund(
  charge: Stripe.Charge,
): Promise<Order | null> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return null;

  const existing = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: orderSelect,
  });
  if (!existing) return null;

  const knownIds = new Set(
    (Array.isArray(existing.refunds)
      ? (existing.refunds as unknown as { id: string }[])
      : []
    ).map((r) => r.id),
  );
  const newRefunds = (charge.refunds?.data ?? []).filter(
    (r) => !knownIds.has(r.id),
  );
  if (newRefunds.length === 0) return toOrder(existing);

  const newEntries = newRefunds.map((r) => ({
    id: r.id,
    amount: (r.amount ?? 0) / 100,
    currency: existing.currency,
    reason: r.reason ?? undefined,
    createdAt: new Date((r.created ?? Date.now() / 1000) * 1000).toISOString(),
  }));
  const nextRefundedAmount = Math.round(charge.amount_refunded) / 100;
  const isFullRefund = nextRefundedAmount >= existing.total - 0.001;

  const restocked = isFullRefund && existing.status !== "refunded";
  const updated = await prisma.$transaction(async (tx) => {
    const priorRefunds = Array.isArray(existing.refunds)
      ? (existing.refunds as unknown as object[])
      : [];
    if (restocked) {
      const lines: ReservedLine[] = (
        Array.isArray(existing.items)
          ? (existing.items as unknown as ReservedLine[])
          : []
      ).map((item) => ({ slug: item.slug, quantity: item.quantity }));
      await restoreStock(tx, lines);
    }
    return tx.order.update({
      where: { id: existing.id },
      data: {
        refundedAmount: nextRefundedAmount,
        refunds: [
          ...priorRefunds,
          ...newEntries,
        ] as unknown as Prisma.InputJsonValue,
        ...(isFullRefund ? { status: "refunded" as const } : {}),
      },
      select: orderSelect,
    });
  });

  if (restocked) revalidateCatalog();
  return toOrder(updated);
}

export async function releaseReservationById(pendingId: string): Promise<void> {
  const released = await prisma.$transaction(async (tx) => {
    const pending = await tx.pendingCheckout.findUnique({
      where: { id: pendingId },
    });
    if (!pending || pending.status !== "reserved") return false;
    await restoreStock(tx, toReserved(pending.reservedStock));
    await tx.pendingCheckout.update({
      where: { id: pendingId },
      data: { status: "released" },
    });
    return true;
  });
  if (released) revalidateCatalog();
}
