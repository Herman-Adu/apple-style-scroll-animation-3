"use server"

import { isEmailConfigured, sendEmail } from "./provider"
import { orderConfirmationEmail, businessOrderNotificationEmail, lowStockAlertEmail, testEmail } from "./templates"
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

/**
 * Notify the business that a new order was placed. Sends to EMAIL_TO, falling
 * back to EMAIL_FROM so the shop is still alerted if EMAIL_TO isn't configured.
 * Fire-and-forget: callers must never block an order on this.
 */
export async function sendOrderNotification(params: { order: Order; customerName?: string }) {
  const to = process.env.EMAIL_TO || process.env.EMAIL_FROM
  if (!to) return { ok: true as const, id: null, skipped: true as const, reason: "no recipient configured" }
  const { subject, html, text } = businessOrderNotificationEmail({ order: params.order, customerName: params.customerName })
  return sendEmail({ to, subject, html, text })
}

/** Admin: report whether a Resend key is configured (server-side env read). */
export async function getEmailConfigured(): Promise<boolean> {
  return isEmailConfigured()
}

/** Admin: send a test email to verify Resend + sending domain are working. */
export async function sendTestEmail(params: { to: string }) {
  const { subject, html, text } = testEmail()
  return sendEmail({ to: params.to, subject, html, text })
}
