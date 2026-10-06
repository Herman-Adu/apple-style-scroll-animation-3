import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/db/prisma"
import type { WaitingByProduct } from "../domain/demand"

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

/**
 * How many people are still waiting for each product. Sent alerts are skipped
 * by the `notifiedAt: null` filter and unsubscribed rows no longer exist, so
 * neither inflates the number.
 */
export async function countWaitingByProduct(): Promise<WaitingByProduct> {
  const groups = await prisma.stockAlert.groupBy({
    by: ["productSlug"],
    where: { notifiedAt: null },
    _count: { _all: true },
  })
  return Object.fromEntries(groups.map((group) => [group.productSlug, group._count._all]))
}

export async function deleteAlertById(id: number): Promise<boolean> {
  const { count } = await prisma.stockAlert.deleteMany({ where: { id } })
  return count > 0
}

export type WaitingAlert = { id: number; email: string; token: string }

/**
 * Takes ownership of every waiting alert for a product. Each row is claimed
 * with a conditional update, so when two restock paths race only one of them
 * wins a given row and nobody is emailed twice.
 */
export async function claimWaitingAlerts(productSlug: string): Promise<WaitingAlert[]> {
  const waiting = await prisma.stockAlert.findMany({
    where: { productSlug, notifiedAt: null },
    select: { id: true, email: true, token: true },
  })
  const claimed: WaitingAlert[] = []
  for (const alert of waiting) {
    const { count } = await prisma.stockAlert.updateMany({
      where: { id: alert.id, notifiedAt: null },
      data: { notifiedAt: new Date() },
    })
    if (count === 1) claimed.push(alert)
  }
  return claimed
}

/** Hands a claim back after a failed send so the next restock retries it. */
export async function releaseAlertClaim(id: number): Promise<void> {
  await prisma.stockAlert.update({ where: { id }, data: { notifiedAt: null } })
}

/** The unsubscribe token is a random secret, so deleting by it is the whole authorisation. */
export async function removeAlertByToken(token: string): Promise<boolean> {
  const { count } = await prisma.stockAlert.deleteMany({ where: { token } })
  return count > 0
}
