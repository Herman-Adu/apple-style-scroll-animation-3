import "server-only";

import type { Prisma } from "@prisma/client";

import { recordSale, type ProductMap } from "@/features/catalog";
import { effectiveProductsFor } from "./effective-products";
import type { ReservedLine } from "./restore-stock";

export async function commitStock(
  tx: Prisma.TransactionClient,
  lines: ReservedLine[],
): Promise<{ reserved: ReservedLine[]; crossedLowStock: any[] }> {
  const clean = lines.filter((l) => l.quantity > 0);
  const slugs = [...new Set(clean.map((l) => l.slug))];
  if (slugs.length === 0) return { reserved: [], crossedLowStock: [] };

  const before = await effectiveProductsFor(slugs, tx);
  const sale = recordSale(before, clean);
  if (!sale.ok)
    throw new Error(sale.error ?? "Some items are no longer available.");

  const decremented: ReservedLine[] = [];
  const crossedLowStock: any[] = [];
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
