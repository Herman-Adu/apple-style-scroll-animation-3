import { formatMoney } from "@/lib/format"
import type { Order } from "@/lib/orders/types"
import { carrierLabel } from "@/lib/orders/tracking"
import { renderEmail, renderText, type RenderContext } from "./blocks/render"
import { getSystemTemplate } from "./blocks/system-templates"
import { DEFAULT_BRANDING, type EmailBlock, type EmailBranding } from "./blocks/types"

/**
 * Transactional + branded email templates, now rendered through the block
 * engine (features/email/blocks). Each function keeps its original signature so
 * existing callers (checkout, offer grants, admin) are unchanged, and each
 * accepts OPTIONAL `branding` / `blocks` overrides so the server can render an
 * admin-customized version pulled from the database. With no overrides they
 * render the built-in system layout — pure and synchronous, so the admin live
 * preview can call them directly with no network round-trip.
 */

const INK = "#0a0a0a"
const MUTED = "#6b7280"
const BORDER = "#e5e7eb"

type Rendered = { subject: string; html: string; text: string }

function brand(partial?: Partial<EmailBranding>): EmailBranding {
  return { ...DEFAULT_BRANDING, ...(partial ?? {}) }
}

function fillSubject(subject: string, vars: Record<string, string>): string {
  return subject.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => vars[k] ?? "")
}

/** Escape text destined for an HTML attribute (e.g. alt text). */
function escAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Resolve a product image path to an absolute URL. Mirrors blocks/render.ts's
 * resolveSrc — emails have no page origin, so a root-relative product image
 * path never loads in a mail client without a baseUrl prefix.
 */
function resolveSrc(src: string, baseUrl?: string): string {
  const s = String(src ?? "")
  if (!baseUrl || !s) return s
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:")) return s
  const base = baseUrl.replace(/\/$/, "")
  return `${base}${s.startsWith("/") ? s : `/${s}`}`
}

/** Dynamic order line-item table injected into the orderSummary block slot. */
function orderSummaryHtml(order: Order, baseUrl?: string): string {
  const rows = order.items
    .map((item) => {
      const thumb = item.image
        ? `<td width="48" style="padding:12px 8px 12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;">
             <img src="${resolveSrc(item.image, baseUrl)}" alt="${escAttr(item.name)}" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:8px;border:1px solid ${BORDER};object-fit:cover;" />
           </td>`
        : ""
      return `
      <tr>
        ${thumb}
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.color ? `${item.color} · ` : ""}Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${INK};font-size:14px;white-space:nowrap;vertical-align:top;">
          ${formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
        </td>
      </tr>`
    })
    .join("")

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
          <td style="padding:8px 0;color:#059669;font-size:13px;">Discount${
            order.appliedOffers && order.appliedOffers.length
              ? ` (${order.appliedOffers.map((o) => o.label).join(", ")})`
              : ""
          }</td>
          <td style="padding:8px 0;text-align:right;color:#059669;font-size:13px;white-space:nowrap;">−${formatMoney({ amount: order.discount, currency: order.currency })}</td>
        </tr>`
      : ""

  return `
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
      <tr>
        <td style="padding:14px 0 0;color:${MUTED};font-size:13px;">Subtotal</td>
        <td style="padding:14px 0 0;text-align:right;color:${MUTED};font-size:13px;white-space:nowrap;">${formatMoney({ amount: order.subtotal, currency: order.currency })}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:8px 0;color:${MUTED};font-size:13px;">Shipping</td>
        <td style="padding:8px 0;text-align:right;color:${MUTED};font-size:13px;white-space:nowrap;">${order.shipping === 0 ? "Free" : formatMoney({ amount: order.shipping, currency: order.currency })}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;color:${INK};font-size:15px;font-weight:700;">Total</td>
        <td style="padding:12px 0 0;text-align:right;color:${INK};font-size:15px;font-weight:700;white-space:nowrap;">${formatMoney({ amount: order.total, currency: order.currency })}</td>
      </tr>
    </table>
  </td></tr>`
}

function shopUrl(vars?: Record<string, string>): string {
  return vars?.shop_url || "/products"
}

export function orderConfirmationEmail(params: {
  name: string
  order: Order
  branding?: Partial<EmailBranding>
  blocks?: EmailBlock[]
  shopUrl?: string
  orderUrl?: string
  baseUrl?: string
}): Rendered {
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("order_confirmation")!.blocks
  const vars: Record<string, string> = {
    customer_name: params.name,
    brand_name: b.brandName,
    order_number: params.order.number,
    shop_url: params.shopUrl ?? "/products",
    // The order confirmation CTA links here — the customer's Orders & invoices
    // tab — rather than back to the store.
    order_url: params.orderUrl ?? "/account?tab=orders",
  }
  const ctx: RenderContext = {
    vars,
    dynamic: { orderSummary: orderSummaryHtml(params.order, params.baseUrl) },
    baseUrl: params.baseUrl,
  }
  return {
    subject: fillSubject(getSystemTemplate("order_confirmation")!.subject, vars),
    html: renderEmail(blocks, b, ctx),
    text: renderText(blocks, b, ctx),
  }
}

const ACCENT = "#0f766e"

function offerHeadline(offer: { kind: string; value?: number; label: string }): string {
  switch (offer.kind) {
    case "percent":
      return `${offer.value ?? 0}% off`
    case "shipping":
      return "Free shipping"
    default:
      return offer.label
  }
}

export function personalOfferEmail(params: {
  name: string
  offer: { label: string; kind: string; value?: number; expiresAt?: string; note?: string }
  shopUrl: string
  branding?: Partial<EmailBranding>
  blocks?: EmailBlock[]
  baseUrl?: string
}): Rendered {
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("personal_offer")!.blocks
  const headline = offerHeadline(params.offer)
  const validUntil = params.offer.expiresAt
    ? new Date(params.offer.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null
  const expiry = [validUntil ? `Valid until ${validUntil}.` : "", params.offer.note ?? ""].filter(Boolean).join(" ")

  const vars: Record<string, string> = {
    customer_name: params.name,
    brand_name: b.brandName,
    shop_url: params.shopUrl,
    offer_headline: headline,
    offer_label: params.offer.label || "Special offer",
    offer_expiry: expiry,
  }
  const ctx: RenderContext = { vars, baseUrl: params.baseUrl }
  return {
    subject: fillSubject(getSystemTemplate("personal_offer")!.subject, vars),
    html: renderEmail(blocks, b, ctx),
    text: renderText(blocks, b, ctx),
  }
}

/**
 * Business order notification (internal). Block-based like the customer-facing
 * templates so it is editable/previewable in Admin -> Email -> Templates, even
 * though it targets the team inbox rather than customers.
 */
export function businessOrderNotificationEmail(params: {
  order: Order
  customerName?: string
  branding?: Partial<EmailBranding>
  blocks?: EmailBlock[]
  adminUrl?: string
  baseUrl?: string
}): Rendered {
  const { order, customerName } = params
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("order_notification")!.blocks
  const total = formatMoney({ amount: order.total, currency: order.currency })
  const vars: Record<string, string> = {
    customer_name: customerName || order.email,
    customer_email: order.email,
    brand_name: b.brandName,
    order_number: order.number,
    placed_at: new Date(order.createdAt).toLocaleString(),
    admin_url: params.adminUrl ?? "/admin",
    total,
  }
  const ctx: RenderContext = {
    vars,
    dynamic: { orderSummary: orderSummaryHtml(order, params.baseUrl) },
    baseUrl: params.baseUrl,
  }
  return {
    subject: fillSubject(getSystemTemplate("order_notification")!.subject, vars),
    html: renderEmail(blocks, b, ctx),
    text: renderText(blocks, b, ctx),
  }
}

/**
 * Refund confirmation (transactional). Block-based so it is editable/previewable
 * in Admin -> Email -> Templates. The full-vs-partial copy differs materially
 * between the two cases, so that copy is computed into vars rather than stored
 * as static block text; admins can still restyle the surrounding layout and
 * add/remove blocks.
 */
export function refundConfirmationEmail(params: {
  name: string
  order: Order
  amount: number
  isFullRefund: boolean
  branding?: Partial<EmailBranding>
  blocks?: EmailBlock[]
  orderUrl?: string
  baseUrl?: string
}): Rendered {
  const { order, amount, isFullRefund } = params
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("refund_confirmation")!.blocks
  const amountLabel = formatMoney({ amount, currency: order.currency })
  const totalRefunded = formatMoney({ amount: order.refundedAmount ?? amount, currency: order.currency })
  const orderTotal = formatMoney({ amount: order.total, currency: order.currency })

  const vars: Record<string, string> = {
    customer_name: params.name,
    brand_name: b.brandName,
    order_number: order.number,
    amount: amountLabel,
    refund_eyebrow: isFullRefund ? "Order cancelled & refunded" : "Refund processed",
    refund_subheading: isFullRefund
      ? `Order ${order.number} has been cancelled and *fully refunded*.`
      : `We've processed a *partial refund* of ${amountLabel} for order ${order.number}.`,
    refund_note: isFullRefund
      ? `The full order total has been returned to your original payment method. It can take 5–10 business days to appear on your statement.`
      : `Total refunded on this order so far: ${totalRefunded} of ${orderTotal}. It can take 5–10 business days to appear on your statement.`,
    order_url: params.orderUrl ?? "/account?tab=orders",
  }
  const ctx: RenderContext = { vars, baseUrl: params.baseUrl }
  return {
    subject: isFullRefund
      ? `Order ${order.number} cancelled — ${amountLabel} refunded`
      : `Refund processed — ${amountLabel} for order ${order.number}`,
    html: renderEmail(blocks, b, ctx),
    text: renderText(blocks, b, ctx),
  }
}

export function shippingConfirmationEmail(params: {
  name: string
  order: Order
  branding?: Partial<EmailBranding>
  baseUrl?: string
}): Rendered {
  const { order } = params
  const b = brand(params.branding)
  const carrier = carrierLabel(order.carrier)

  const blocks: EmailBlock[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: "On its way",
      heading: `Hi ${params.name}, your order has shipped`,
      subheading: `Order ${order.number} is on its way via *${carrier}*.`,
      imageUrl: "",
      align: "left",
    },
    {
      id: "callout",
      type: "callout",
      title: order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : "Tracking number coming soon",
      body: order.trackingUrl
        ? "Use the button below to follow your package's progress."
        : "We'll follow up with a tracking link as soon as it's available.",
    },
    ...(order.trackingUrl
      ? ([
          {
            id: "track",
            type: "button",
            label: "Track your package",
            href: order.trackingUrl,
            align: "left",
          },
        ] satisfies EmailBlock[])
      : []),
  ]
  const html = renderEmail(blocks, b, { baseUrl: params.baseUrl })
  const text = `Your order has shipped — ${order.number}\n\nCarrier: ${carrier}${
    order.trackingNumber ? `\nTracking number: ${order.trackingNumber}` : ""
  }${order.trackingUrl ? `\nTrack: ${order.trackingUrl}` : ""}`
  return {
    subject: `Your order ${order.number} has shipped`,
    html,
    text,
  }
}

export function testEmail(params?: { branding?: Partial<EmailBranding>; baseUrl?: string }): Rendered {
  const b = brand(params?.branding)
  const blocks: EmailBlock[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: "Configuration test",
      heading: "Your email is *live*",
      subheading: "If you're reading this, your Resend key and sending domain are working correctly.",
      imageUrl: "/email/hero-momo.png",
      align: "left",
    },
    {
      id: "text",
      type: "text",
      text: "This is a test from your MOMO admin dashboard. Branded templates render from the block engine and are ready to send.",
      align: "left",
    },
  ]
  return {
    subject: `${b.brandName} — email configuration test`,
    html: renderEmail(blocks, b, { baseUrl: params?.baseUrl }),
    text: renderText(blocks, b, {}),
  }
}

/** Dynamic inventory row table injected into the lowStockItems block slot. */
function lowStockItemsHtml(items: { name: string; slug: string; stock: number; threshold: number }[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.slug}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;font-size:14px;white-space:nowrap;">
          <span style="color:${item.stock === 0 ? "#dc2626" : "#d97706"};font-weight:600;">${item.stock} left</span><br /><span style="color:${MUTED};font-size:12px;">threshold ${item.threshold}</span>
        </td>
      </tr>`,
    )
    .join("")
  return `<tr><td style="padding:20px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table></td></tr>`
}

export function lowStockAlertEmail(params: {
  items: { name: string; slug: string; stock: number; threshold: number }[]
  branding?: Partial<EmailBranding>
  blocks?: EmailBlock[]
  adminUrl?: string
  baseUrl?: string
}): Rendered {
  const { items } = params
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("low_stock")!.blocks
  const vars: Record<string, string> = {
    brand_name: b.brandName,
    item_count: String(items.length),
    admin_url: params.adminUrl ?? "/admin",
  }
  const ctx: RenderContext = {
    vars,
    dynamic: { lowStockItems: lowStockItemsHtml(items) },
    baseUrl: params.baseUrl,
  }
  const text = `Low stock alert\n\n${items.map((i) => `${i.name} (${i.slug}) — ${i.stock} left, threshold ${i.threshold}`).join("\n")}`
  return {
    subject: fillSubject(getSystemTemplate("low_stock")!.subject, vars),
    html: renderEmail(blocks, b, ctx),
    text: `${renderText(blocks, b, ctx)}\n\n${text}`,
  }
}
