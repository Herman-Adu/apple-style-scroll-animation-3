import "server-only";

import type { Prisma } from "@prisma/client";

import { effectiveProductsFor } from "./effective-products";

export interface ReservedLine {
  slug: string;
  quantity: number;
}

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
