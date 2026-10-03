import "server-only";

import type { Prisma } from "@prisma/client";
import { after } from "next/server";

import { getAllProducts } from "@/features/products";
import { productSchema } from "@/features/products";
import { recordSale, toMap, type ProductMap } from "@/features/catalog";
import { sendLowStockAlert } from "@/features/email";
import { getStoreSettingsAction } from "@/features/settings/actions";

/** A stock delta: `quantity` units of `slug` were removed (and can be restored). */
export interface ReservedLine {
  slug: string;
  quantity: number;
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
  /** Product image, carried through so the admin alert email can show a thumbnail. */
  image?: string;
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
  after(async () => {
    try {
      const settings = await getStoreSettingsAction();
      if (!settings.emailAlerts || !settings.supportEmail) {
        return;
      }
      await sendLowStockAlert({ to: settings.supportEmail, items });
    } catch {
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
    if (prev.stock > threshold && next.stock <= threshold) {
      crossedLowStock.push({
        name: next.name,
        slug,
        stock: next.stock,
        threshold,
        image: next.image,
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

export function toReserved(raw: unknown): ReservedLine[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ReservedLine[]).filter(
    (r) => r && typeof r.slug === "string" && typeof r.quantity === "number",
  );
}
