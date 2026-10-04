"use server"

// Admin-only refund action, mirroring the auth/authorization shape of
// db-actions.ts: identity + admin role are enforced server-side, and no
// money-related input from the client is trusted beyond "which order, how
// much." Cancel-and-refund and partial-refund both funnel through here so
// there is exactly one place that talks to Stripe about money movement.

import { headers } from "next/headers"
import type { Prisma } from "@prisma/client"

import { auth } from "@/lib/auth/adapters/instance"
import { prisma } from "@/lib/db/prisma"
import { effectiveRole } from "@/lib/auth/domain/config"
import { stripe } from "@/lib/stripe/server"
import { restoreStock, type ReservedLine } from "../finalize/checkout-finalize"
import { dispatchRefundEmail } from "../notifications"
import { revalidateCatalog } from "@/features/catalog/server"
import type { Order, OrderStatus, RefundEntry } from "../types"

const VALID_STATUSES: OrderStatus[] = ["processing", "fulfilled", "cancelled", "refunded"]

const orderSelect = {
  id: true,
  number: true,
  userId: true,
  email: true,
  status: true,
  items: true,
  subtotal: true,
  shipping: true,
  discount: true,
  appliedOffers: true,
  total: true,
  currency: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  refundedAmount: true,
  refunds: true,
  carrier: true,
  trackingNumber: true,
  trackingUrl: true,
  shippedAt: true,
  createdAt: true,
} as const

type OrderRow = {
  id: string
  number: string
  userId: string
  email: string
  status: string
  items: unknown
  subtotal: number
  shipping: number
  discount: number
  appliedOffers: unknown
  total: number
  currency: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  refundedAmount: number
  refunds: unknown
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  shippedAt: Date | null
  createdAt: Date
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    userId: row.userId,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    status: (VALID_STATUSES.includes(row.status as OrderStatus) ? row.status : "processing") as OrderStatus,
    items: Array.isArray(row.items) ? (row.items as Order["items"]) : [],
    subtotal: row.subtotal,
    shipping: row.shipping,
    discount: row.discount ?? 0,
    appliedOffers: Array.isArray(row.appliedOffers) ? (row.appliedOffers as Order["appliedOffers"]) : [],
    total: row.total,
    currency: row.currency,
    stripeSessionId: row.stripeSessionId ?? undefined,
    stripePaymentIntentId: row.stripePaymentIntentId ?? undefined,
    refundedAmount: row.refundedAmount ?? 0,
    refunds: Array.isArray(row.refunds) ? (row.refunds as Order["refunds"]) : [],
    carrier: (row.carrier as Order["carrier"]) ?? undefined,
    trackingNumber: row.trackingNumber ?? undefined,
    trackingUrl: row.trackingUrl ?? undefined,
    shippedAt: row.shippedAt ? row.shippedAt.toISOString() : undefined,
  }
}

async function requireAdminId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error("Not signed in.")
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, roleOverride: true },
  })
  if (!me || effectiveRole(me) !== "admin") throw new Error("Admins only.")
  return session.user.id
}

/** Resolve (and persist) the PaymentIntent id for an order, falling back to the
 * Stripe Checkout Session when the column wasn't captured at finalize time. */
async function resolvePaymentIntentId(row: OrderRow): Promise<string> {
  if (row.stripePaymentIntentId) return row.stripePaymentIntentId
  if (!row.stripeSessionId) {
    throw new Error("This order has no linked Stripe payment — it cannot be refunded automatically.")
  }
  const session = await stripe.checkout.sessions.retrieve(row.stripeSessionId)
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  if (!paymentIntentId) {
    throw new Error("Stripe has no payment on record for this order — it cannot be refunded automatically.")
  }
  await prisma.order.update({ where: { id: row.id }, data: { stripePaymentIntentId: paymentIntentId } })
  return paymentIntentId
}

/**
 * Refund an order via Stripe. Omit `amount` for a full refund (which also
 * restocks every line item and marks the order "refunded"); pass `amount` (in
 * the order's major currency unit) for a partial refund, which records the
 * refund but does not change status or stock.
 */
export async function refundOrderAction(orderId: string, amount?: number, reason?: string): Promise<Order> {
  await requireAdminId()

  const existing = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect })
  if (!existing) throw new Error("Order not found.")

  const remaining = Math.round((existing.total - existing.refundedAmount) * 100) / 100
  const requested = amount === undefined ? remaining : Math.round(amount * 100) / 100
  if (requested <= 0 || requested > remaining) {
    throw new Error(`Refund amount must be greater than 0 and at most ${remaining} ${existing.currency}.`)
  }

  const paymentIntentId = await resolvePaymentIntentId(existing)
  const amountInMinorUnits = Math.round(requested * 100)
  const idempotencyKey = `${orderId}:${existing.refundedAmount}:${amountInMinorUnits}`

  const refund = await stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: amountInMinorUnits,
      ...(reason ? { reason: "requested_by_customer" } : {}),
    },
    { idempotencyKey },
  )

  const entry: RefundEntry = {
    id: refund.id,
    amount: requested,
    currency: existing.currency,
    reason,
    createdAt: new Date().toISOString(),
  }
  const isFullRefund = existing.refundedAmount + requested >= existing.total - 0.001

  const updated = await prisma.$transaction(async (tx) => {
    const priorRefunds = Array.isArray(existing.refunds) ? (existing.refunds as unknown as RefundEntry[]) : []
    const nextRefundedAmount = Math.round((existing.refundedAmount + requested) * 100) / 100

    if (isFullRefund) {
      const lines: ReservedLine[] = (
        Array.isArray(existing.items) ? (existing.items as unknown as Order["items"]) : []
      ).map((item) => ({ slug: item.slug, quantity: item.quantity }))
      await restoreStock(tx, lines)
    }

    return tx.order.update({
      where: { id: orderId },
      data: {
        refundedAmount: nextRefundedAmount,
        refunds: [...priorRefunds, entry] as unknown as Prisma.InputJsonValue,
        ...(isFullRefund ? { status: "refunded" as OrderStatus } : {}),
      },
      select: orderSelect,
    })
  })

  if (isFullRefund) revalidateCatalog()

  const order = toOrder(updated)
  void dispatchRefundEmail(order, entry, isFullRefund).catch(() => {})

  return order
}
