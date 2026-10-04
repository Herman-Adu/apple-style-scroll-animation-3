import "server-only"

// Single place that fires the customer confirmation + business notification
// emails for a newly-created order. Called by whichever path actually creates
// the order (the Stripe webhook, or the return page as a fallback). Because
// finalizeCheckout is idempotent and returns the Order only on the call that
// created it, this runs exactly once per order. Never throws — email is
// best-effort and must not affect payment/order state.

import { prisma } from "@/lib/db/prisma"
import {
  sendOrderConfirmation,
  sendOrderNotification,
  sendRefundConfirmation,
  sendShippingConfirmation,
} from "@/features/email"
import type { Order, RefundEntry } from "../domain/types"

export async function dispatchOrderEmails(order: Order): Promise<void> {
  let name = order.email
  try {
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { name: true },
    })
    if (user?.name) name = user.name
  } catch {
    // fall back to the email as the display name
  }
  await Promise.allSettled([
    sendOrderConfirmation({ to: order.email, name, order }),
    sendOrderNotification({ order, customerName: name }),
  ])
}

/** Fires the customer refund-confirmation email. Best-effort — never throws,
 * so a flaky send can never affect the already-committed refund state. */
export async function dispatchRefundEmail(order: Order, entry: RefundEntry, isFullRefund: boolean): Promise<void> {
  let name = order.email
  try {
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true } })
    if (user?.name) name = user.name
  } catch {
    // fall back to the email as the display name
  }
  await sendRefundConfirmation({ to: order.email, name, order, amount: entry.amount, isFullRefund })
}

/** Fires the customer shipping-confirmation email the first time tracking is
 * saved on an order. Best-effort — never throws. */
export async function dispatchShippingEmail(order: Order): Promise<void> {
  let name = order.email
  try {
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { name: true } })
    if (user?.name) name = user.name
  } catch {
    // fall back to the email as the display name
  }
  await sendShippingConfirmation({ to: order.email, name, order })
}
