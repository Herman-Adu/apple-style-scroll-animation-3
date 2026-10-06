import "server-only";

import type { Prisma } from "@prisma/client";

import { crossedBackInStock, effectiveStock } from "@/features/products";
import {
  notifyBackInStock,
  type RestockedProduct,
} from "@/features/stock-alerts/server";
import { effectiveProductsFor } from "./effective-products";

export interface ReservedLine {
  slug: string;
  quantity: number;
}

/** Puts units back and reports which products went from sold out to available. */
export async function restoreStock(
  tx: Prisma.TransactionClient,
  reserved: ReservedLine[],
): Promise<RestockedProduct[]> {
  const list = reserved.filter((r) => r.quantity > 0);
  const slugs = [...new Set(list.map((r) => r.slug))];
  if (slugs.length === 0) return [];

  const before = await effectiveProductsFor(slugs, tx);
  const restocked = new Map<string, RestockedProduct>();
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
    if (crossedBackInStock(effectiveStock(prev), effectiveStock(next))) {
      restocked.set(slug, { slug, name: next.name });
    }
  }
  return [...restocked.values()];
}

/** Tells waiting customers once the restock has committed; a failure here never reaches the caller. */
export async function announceRestock(
  restocked: RestockedProduct[],
): Promise<void> {
  if (restocked.length === 0) return;
  try {
    await notifyBackInStock(restocked);
  } catch {
    // The restock already happened; alerts are retried on the next restock.
  }
}

export function toReserved(raw: unknown): ReservedLine[] {
  if (!Array.isArray(raw)) return [];
  return (raw as ReservedLine[]).filter(
    (r) => r && typeof r.slug === "string" && typeof r.quantity === "number",
  );
}
