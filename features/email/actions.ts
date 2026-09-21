"use server"

import { sendEmail } from "./provider"
import { orderConfirmationEmail, lowStockAlertEmail } from "./templates"
import type { Order } from "@/lib/orders/types"

/**
 * Server actions for transactional email. These are the only email entry points
 * the app calls — callers never touch the transport directly. Each returns a
 * result but callers treat email as fire-and-forget: a failed or skipped send
 * must never block an order or a stock update.
 */

export async function sendOrderConfirmation(params: {
  to: string
  name: string
  order: Order
}) {
  const { subject, html, text } = orderConfirmationEmail({ name: params.name, order: params.order })
  return sendEmail({ to: params.to, subject, html, text })
}

export async function sendLowStockAlert(params: {
  to: string
  items: { name: string; slug: string; stock: number; threshold: number }[]
}) {
  if (params.items.length === 0) return { ok: true as const, id: null, skipped: true as const, reason: "no items" }
  const { subject, html, text } = lowStockAlertEmail({ items: params.items })
  return sendEmail({ to: params.to, subject, html, text })
}
