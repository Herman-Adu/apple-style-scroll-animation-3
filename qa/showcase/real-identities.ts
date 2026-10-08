import { PrismaClient } from "@prisma/client"
import type { BrowserContext } from "@playwright/test"
import { DEMO_EMAIL_DOMAIN } from "../../scripts/lib/showcase-demo-data.mjs"
import { buildIdentityAliases, identityMaskScript, type MaskOptions, type RealIdentity } from "./identity-mask"

/**
 * Everyone in the database who is not part of the demo seed. The seed does not
 * hide real rows: the admin's orders, customers and messages list them side by
 * side, and product pages carry real review authors, so a recording needs to know
 * who to stand in for.
 */

const prisma = new PrismaClient()
const demoSuffix = `@${DEMO_EMAIL_DOMAIN}`

export async function fetchRealIdentities(): Promise<RealIdentity[]> {
  const [users, orders, messages, logs, subscribers, reviews] = await Promise.all([
    prisma.user.findMany({ where: { NOT: { email: { endsWith: demoSuffix } } }, select: { name: true, email: true } }),
    prisma.order.findMany({ where: { NOT: { email: { endsWith: demoSuffix } } }, select: { email: true }, distinct: ["email"] }),
    prisma.customerMessage.findMany({
      where: { NOT: { customerEmail: { endsWith: demoSuffix } } },
      select: { customerName: true, customerEmail: true },
      distinct: ["customerEmail"],
    }),
    prisma.emailLog.findMany({ where: { NOT: { to: { endsWith: demoSuffix } } }, select: { to: true }, distinct: ["to"] }),
    prisma.subscriber.findMany({ where: { NOT: { email: { endsWith: demoSuffix } } }, select: { email: true }, distinct: ["email"] }),
    prisma.review.findMany({ select: { author: true } }),
  ])

  return [
    ...users.map((row) => ({ name: row.name ?? "", email: row.email })),
    ...orders.map((row) => ({ name: "", email: row.email })),
    ...messages.map((row) => ({ name: row.customerName ?? "", email: row.customerEmail })),
    ...logs.map((row) => ({ name: "", email: row.to })),
    ...subscribers.map((row) => ({ name: "", email: row.email })),
    ...reviews.map((row) => ({ name: row.author ?? "", email: "" })),
  ]
}

let pending: Promise<RealIdentity[]> | null = null

/**
 * Swaps every real name, address and avatar photo for a stand-in, before the page
 * paints. Install it on the context of every clip: if the identities cannot be
 * read, it throws rather than recording someone real.
 */
export async function installIdentityMask(context: BrowserContext, options: MaskOptions = {}) {
  pending ??= fetchRealIdentities()
  const aliases = buildIdentityAliases(await pending, options)
  await context.addInitScript(identityMaskScript, { aliases })
  return aliases
}

export async function disconnectIdentities() {
  await prisma.$disconnect()
}
