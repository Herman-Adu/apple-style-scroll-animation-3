import "server-only";

import type { Prisma } from "@prisma/client";

const ORDER_NUMBER_LOCK_KEY = 726_001;

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
