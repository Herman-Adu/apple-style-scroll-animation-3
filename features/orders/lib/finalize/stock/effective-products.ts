import "server-only";

import type { Prisma } from "@prisma/client";

import { getAllProducts } from "@/features/products";
import { productSchema } from "@/features/products";
import { toMap, type ProductMap } from "@/features/catalog";

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
