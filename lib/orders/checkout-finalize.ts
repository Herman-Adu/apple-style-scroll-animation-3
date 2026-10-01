import "server-only";

// Shared, transaction-aware checkout mechanics used by BOTH the direct order
// path (db-actions.createOrderAction) and the Stripe payment path (reserve at
// session creation, finalize/release from the webhook). Keeping the oversell
// guard, stock decrement, stock restore, and order-number generation in one
// place means every path enforces identical rules — the storefront can never
// oversell and we never charge for stock we can't fulfil.

import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { after } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { getAllProducts } from "@/lib/data/products";
import { productSchema } from "@/features/products";
import { recordSale, toMap, type ProductMap } from "@/features/catalog/store";
import { incrementDiscountCodeRedemption } from "@/lib/discount-codes/db-actions";
import { sendLowStockAlert } from "@/features/email/actions";
import { getStoreSettingsAction } from "@/lib/settings/db-actions";
import { revalidateCatalog } from "@/lib/catalog/revalidate";
import type { AppliedOffer, Order, OrderStatus } from "./types";

/** A stock delta: `quantity` units of `slug` were removed (and can be restored). */
export interface ReservedLine {
  slug: string;
  quantity: number;
}

const VALID_STATUSES: OrderStatus[] = [
  "processing",
  "fulfilled",
  "cancelled",
  "refunded",
];

const orderSelect = {
  id: true,
  number: true,
  userId: true,
  email: true,
  status: true,
  items: true,
  subtotal: true,
  shipping: true,
  discount: true,
  appliedOffers: true,
  discountCode: true,
  total: true,
  currency: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  refundedAmount: true,
  refunds: true,
  carrier: true,
  trackingNumber: true,
  trackingUrl: true,
  shippedAt: true,
  createdAt: true,
} as const;

type OrderRow = {
  id: string;
  number: string;
  userId: string;
  email: string;
  status: string;
  items: unknown;
  subtotal: number;
  shipping: number;
  discount: number;
  appliedOffers: unknown;
  discountCode?: string | null;
  total: number;
  currency: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  refundedAmount?: number;
  refunds?: unknown;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: Date | null;
  createdAt: Date;
};

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    status: (VALID_STATUSES.includes(row.status as OrderStatus)
      ? row.status
      : "processing") as OrderStatus,
    items: Array.isArray(row.items) ? (row.items as Order["items"]) : [],
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount ?? 0,
    appliedOffers: Array.isArray(row.appliedOffers)
      ? (row.appliedOffers as Order["appliedOffers"])
      : [],
    discountCode: row.discountCode ?? undefined,
    total: row.total,
    currency: row.currency,
    stripeSessionId: row.stripeSessionId ?? undefined,
    stripePaymentIntentId: row.stripePaymentIntentId ?? undefined,
    refundedAmount: row.refundedAmount ?? 0,
    refunds: Array.isArray(row.refunds)
      ? (row.refunds as Order["refunds"])
      : [],
    carrier: (row.carrier as Order["carrier"]) ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    shippedAt: row.shippedAt ? row.shippedAt.toISOString() : undefined,
  };
}

/** Effective (seed + admin overlay) product map for a set of slugs, read inside
 * the given transaction so the stock guard runs against live, consistent data. */
export async function effectiveProductsFor(
  slugs: string[],
  tx: Prisma.TransactionClient,
): Promise<ProductMap> {
  const rows = await tx.productOverlay.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, data: true, deleted: true },
  });
  const map: ProductMap = toMap(
    getAllProducts().filter((p) => slugs.includes(p.slug)),
  );
  for (const row of rows) {
    if (row.deleted) {
      delete map[row.slug];
      continue;
    }
    const parsed = productSchema.safeParse(row.data);
    if (parsed.success) map[row.slug] = parsed.data;
  }
  return map;
}

/** Arbitrary constant key for the order-number advisory lock. */
const ORDER_NUMBER_LOCK_KEY = 726_001;

/**
 * Next human-friendly order reference for the current year, e.g. MOMO-2026-0001.
 *
 * MUST be called inside a transaction. It takes a transaction-scoped Postgres
 * advisory lock first, so concurrent checkouts serialize here: the second caller
 * waits until the first commits, then sees its order and gets the next number.
 * (A plain count()+1 let two simultaneous checkouts compute the same number.)
 * The lock is released automatically at commit/rollback and is safe with
 * PgBouncer transaction pooling. The number is derived from the highest existing
 * suffix, not a row count, so deleting an order can never cause a collision.
 */
export async function nextOrderNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MOMO-${year}-`;

  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ORDER_NUMBER_LOCK_KEY})`;
  const rows = await tx.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(number FROM '[0-9]+$') AS INTEGER)) AS max
    FROM orders
    WHERE number LIKE ${prefix + "%"}`;

  const next = (rows[0]?.max ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * Fire the low-stock admin alert for products that just crossed at or below
 * their threshold (best-effort, never throws — a notification failure must
 * never affect checkout). Scheduled via `after()` rather than a bare
 * fire-and-forget call: in a serverless function, an unawaited promise can be
 * killed mid-flight the instant the response is sent, which silently drops
 * the alert before it ever reaches the email provider. `after()` guarantees
 * this runs to completion once the response has been flushed, without
 * adding latency to the reservation transaction itself.
 */
export type LowStockItem = {
  name: string;
  slug: string;
  stock: number;
  threshold: number;
};

/**
 * Fire a single batched admin alert for items that just crossed into low
 * stock. Exported so callers can invoke it only AFTER the reservation
 * transaction that detected the crossing has actually committed — calling it
 * from inside the transaction would register the alert even if the
 * transaction later rolled back.
 *
 * Wrapped in `after()`, not a bare fire-and-forget call: in a serverless
 * function, an unawaited promise can be killed mid-flight the instant the
 * response is sent, which silently drops the alert before it ever reaches
 * the email provider. `after()` guarantees this runs to completion once the
 * response has been flushed, without adding latency to the caller.
 */
export function notifyLowStock(items: LowStockItem[]): void {
  if (items.length === 0) return;
  console.log("[v0] notifyLowStock: registering after() for", items.length, "item(s)");
  after(async () => {
    try {
      const settings = await getStoreSettingsAction();
      console.log("[v0] notifyLowStock: settings", {
        emailAlerts: settings.emailAlerts,
        supportEmail: settings.supportEmail,
      });
      if (!settings.emailAlerts || !settings.supportEmail) {
        console.log("[v0] notifyLowStock: skipped — alerts disabled or no support email");
        return;
      }
      const result = await sendLowStockAlert({ to: settings.supportEmail, items });
      console.log("[v0] notifyLowStock: sendLowStockAlert result", result);
    } catch (err) {
      console.log("[v0] notifyLowStock: threw", err);
      // Best-effort only.
    }
  });
}

/**
 * Enforce the oversell / last-unit guard and decrement physical stock for
 * `lines` inside `tx`. Pre-orders and unknown slugs are left untouched (matching
 * the storefront rules). Throws if the guard fails so the surrounding
 * transaction rolls back. Returns the exact deltas actually removed (so an
 * abandoned checkout can restore precisely what it reserved) alongside any
 * items that crossed at-or-below their low-stock threshold as a result of
 * this sale — not on every sale while already low, only on the transition
 * into low stock. Callers must invoke `notifyLowStock` with the returned
 * `crossedLowStock` themselves, once their enclosing transaction commits.
 */
export async function commitStock(
  tx: Prisma.TransactionClient,
  lines: ReservedLine[],
): Promise<{ reserved: ReservedLine[]; crossedLowStock: LowStockItem[] }> {
  const clean = lines.filter((l) => l.quantity > 0);
  const slugs = [...new Set(clean.map((l) => l.slug))];
  if (slugs.length === 0) return { reserved: [], crossedLowStock: [] };

  const before = await effectiveProductsFor(slugs, tx);
  const sale = recordSale(before, clean);
  if (!sale.ok)
    throw new Error(sale.error ?? "Some items are no longer available.");

  const decremented: ReservedLine[] = [];
  const crossedLowStock: LowStockItem[] = [];
  for (const slug of slugs) {
    const prev = before[slug];
    const next = sale.map[slug];
    if (!prev || !next || prev.stock === next.stock) continue;
    const data = next as unknown as Prisma.InputJsonValue;
    await tx.productOverlay.upsert({
      where: { slug },
      create: { slug, data, deleted: false },
      update: { data, deleted: false },
    });
    decremented.push({ slug, quantity: prev.stock - next.stock });

    const threshold = next.lowStockThreshold ?? 5;
    console.log("[v0] commitStock:", slug, "prev.stock=", prev.stock, "next.stock=", next.stock, "threshold=", threshold);
    if (prev.stock > threshold && next.stock <= threshold) {
      crossedLowStock.push({
        name: next.name,
        slug,
        stock: next.stock,
        threshold,
      });
    }
  }
  return { reserved: decremented, crossedLowStock };
}

/**
 * Restore previously-reserved stock within `tx` — the inverse of `commitStock`.
 * Reads current effective stock and adds the reserved quantity back, so a
 * concurrent change between reservation and release is preserved.
 */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  reserved: ReservedLine[],
): Promise<void> {
  const list = reserved.filter((r) => r.quantity > 0);
  const slugs = [...new Set(list.map((r) => r.slug))];
  if (slugs.length === 0) return;

  const before = await effectiveProductsFor(slugs, tx);
  for (const { slug, quantity } of list) {
    const prev = before[slug];
    if (!prev) continue;
    const next = { ...prev, stock: prev.stock + quantity };
    const data = next as unknown as Prisma.InputJsonValue;
    await tx.productOverlay.upsert({
      where: { slug },
      create: { slug, data, deleted: false },
      update: { data, deleted: false },
    });
  }
}

function toReserved(raw: unknown): ReservedLine[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ReservedLine[]).filter(
    (r) => r && typeof r.slug === "string" && typeof r.quantity === "number",
  );
}

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

/** Release a reservation for an expired/failed Stripe session: restore the
 * reserved stock and mark the pending row released. Idempotent. */
export async function releaseCheckout(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const pendingId = session.metadata?.pendingCheckoutId;
  if (!pendingId) return;
  await releaseReservationById(pendingId);
}

/**
 * Reconcile a Stripe `charge.refunded` event into the matching Order. This is
 * the safety net for refunds issued directly from the Stripe Dashboard (i.e.
 * NOT through refundOrderAction): it mirrors the same restock-on-full-refund
 * rule, keyed off the PaymentIntent id, and is idempotent by refund id so a
 * refund already recorded by refundOrderAction is never double-applied.
 * Returns the updated Order, or null if no matching order was found.
 */
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

/** Release a reservation by pending id — also used if Stripe session creation
 * fails after we've already reserved stock. Idempotent (no-op unless reserved). */
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
