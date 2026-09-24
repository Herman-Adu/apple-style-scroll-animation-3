"use server"

import { isEmailConfigured, sendEmail } from "./provider"
import {
  orderConfirmationEmail,
  businessOrderNotificationEmail,
  personalOfferEmail,
  lowStockAlertEmail,
  testEmail,
} from "./templates"
import { getBranding, getTemplateBlocksByKey, recordLog } from "./repo"
import type { Order } from "@/lib/orders/types"
import { getBaseUrl } from "@/lib/seo/site"

/**
 * Server actions for transactional email. These are the only email entry points
 * the app calls — callers never touch the transport directly. Each returns a
 * result but callers treat email as fire-and-forget: a failed or skipped send
 * must never block an order or a stock update.
 *
 * Branding and (for customizable templates) block layouts are pulled from the
 * database so edits in the admin builder take effect immediately. If the DB is
 * unreachable, rendering falls back to the built-in system layout. Every send
 * is written to the email log for the Overview dashboard.
 */

export async function sendOrderConfirmation(params: { to: string; name: string; order: Order }) {
  const [branding, blocks] = await Promise.all([getBranding(), getTemplateBlocksByKey("order_confirmation")])
  const { subject, html, text } = orderConfirmationEmail({
    name: params.name,
    order: params.order,
    branding,
    blocks: blocks ?? undefined,
    shopUrl: `${getBaseUrl()}/products`,
  })
  const result = await sendEmail({ to: params.to, subject, html, text })
  await recordLog({
    to: params.to,
    subject,
    templateKey: "order_confirmation",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result
}

export async function sendLowStockAlert(params: {
  to: string
  items: { name: string; slug: string; stock: number; threshold: number }[]
}) {
  if (params.items.length === 0) return { ok: true as const, id: null, skipped: true as const, reason: "no items" }
  const { subject, html, text } = lowStockAlertEmail({ items: params.items })
  const result = await sendEmail({ to: params.to, subject, html, text })
  await recordLog({
    to: params.to,
    subject,
    templateKey: "low_stock",
    type: "transactional",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result
}

export async function sendOrderNotification(params: { order: Order; customerName?: string }) {
  const to = process.env.EMAIL_TO || process.env.EMAIL_FROM
  if (!to) return { ok: true as const, id: null, skipped: true as const, reason: "no recipient configured" }
  const { subject, html, text } = businessOrderNotificationEmail({ order: params.order, customerName: params.customerName })
  const result = await sendEmail({ to, subject, html, text })
  await recordLog({
    to,
    subject,
    templateKey: "order_notification",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result
}

export async function sendPersonalOffer(params: {
  to: string
  name: string
  offer: { label: string; kind: string; value?: number; expiresAt?: string; note?: string }
}) {
  const shopUrl = `${getBaseUrl()}/products`
  const [branding, blocks] = await Promise.all([getBranding(), getTemplateBlocksByKey("personal_offer")])
  const { subject, html, text } = personalOfferEmail({
    name: params.name,
    offer: params.offer,
    shopUrl,
    branding,
    blocks: blocks ?? undefined,
  })
  const result = await sendEmail({ to: params.to, subject, html, text })
  await recordLog({
    to: params.to,
    subject,
    templateKey: "personal_offer",
    type: "transactional",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result
}

/** Admin: report whether a Resend key is configured (server-side env read). */
export async function getEmailConfigured(): Promise<boolean> {
  return isEmailConfigured()
}

/** Admin: send a test email to verify Resend + sending domain are working. */
export async function sendTestEmail(params: { to: string }) {
  const branding = await getBranding()
  const { subject, html, text } = testEmail({ branding })
  const result = await sendEmail({ to: params.to, subject, html, text })
  await recordLog({
    to: params.to,
    subject,
    templateKey: "test",
    type: "test",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  })
  return result
}
