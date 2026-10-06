import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/db/prisma"

/**
 * Stores one waiting alert per (email, product). A repeat request changes
 * nothing for a waiting row and re-arms one that was already sent, always
 * keeping the original unsubscribe token.
 */
export async function requestStockAlert(input: { email: string; productSlug: string }): Promise<void> {
  await prisma.stockAlert.upsert({
    where: { email_productSlug: { email: input.email, productSlug: input.productSlug } },
    create: { email: input.email, productSlug: input.productSlug, token: randomBytes(24).toString("base64url") },
    update: { notifiedAt: null },
  })
}
