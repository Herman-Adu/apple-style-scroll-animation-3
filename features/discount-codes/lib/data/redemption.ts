import { prisma } from "@/lib/db/prisma";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Best-effort redemption increment, called once an order is finalized. Never
 * throws — a failure here must not block order creation. */
export async function incrementDiscountCodeRedemption(
  code: string,
): Promise<void> {
  await prisma.discountCode.updateMany({
    where: { code: normalizeCode(code) },
    data: { redemptionCount: { increment: 1 } },
  });
}
