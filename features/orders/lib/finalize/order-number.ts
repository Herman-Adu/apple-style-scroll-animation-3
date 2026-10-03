import "server-only";

import type { Prisma } from "@prisma/client";

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
