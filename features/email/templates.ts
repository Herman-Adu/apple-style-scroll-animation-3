import { formatMoney } from "@/lib/format"
import type { Order } from "@/lib/orders/types"
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

/** Dynamic order line-item table injected into the orderSummary block slot. */
function orderSummaryHtml(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.color ? `${item.color} · ` : ""}Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${INK};font-size:14px;white-space:nowrap;">
          ${formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
        </td>
      </tr>`,
    )
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
}): Rendered {
  const b = brand(params.branding)
  const blocks = params.blocks ?? getSystemTemplate("order_confirmation")!.blocks
  const vars: Record<string, string> = {
    customer_name: params.name,
    brand_name: b.brandName,
    order_number: params.order.number,
    shop_url: params.shopUrl ?? "/products",
  }
  const ctx: RenderContext = { vars, dynamic: { orderSummary: orderSummaryHtml(params.order) } }
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
  const ctx: RenderContext = { vars }
  return {
    subject: fillSubject(getSystemTemplate("personal_offer")!.subject, vars),
    html: renderEmail(blocks, b, ctx),
    text: renderText(blocks, b, ctx),
  }
}

/**
 * Business order notification (internal). Kept as a focused branded summary —
 * not block-based, since it targets the team inbox rather than customers.
 */
export function businessOrderNotificationEmail(params: { order: Order; customerName?: string }): Rendered {
  const { order, customerName } = params
  const b = brand()
  const meta = `
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:${MUTED};font-size:13px;">Customer</td><td style="padding:4px 0;text-align:right;color:${INK};font-size:13px;">${order.email}</td></tr>
      <tr><td style="padding:4px 0;color:${MUTED};font-size:13px;">Placed</td><td style="padding:4px 0;text-align:right;color:${INK};font-size:13px;">${new Date(order.createdAt).toLocaleString()}</td></tr>
    </table>
  </td></tr>`

  const blocks: EmailBlock[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: "New order received",
      heading: `Order ${order.number}`,
      subheading: `A new order was just placed${customerName ? ` by *${customerName}*` : ""}.`,
      imageUrl: "",
      align: "left",
    },
  ]
  const html = renderEmail(blocks, b, {}).replace(
    "<tr><td style=\"padding:0 28px 32px;\"></td></tr>",
    `${meta}${orderSummaryHtml(order)}<tr><td style="padding:20px 28px 0;"><p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">Manage this order in the admin dashboard under Orders.</p></td></tr><tr><td style="padding:0 28px 32px;"></td></tr>`,
  )
  const text = `New order received — ${order.number}\n\n${customerName ? customerName + " · " : ""}${order.email}\nPlaced: ${new Date(order.createdAt).toLocaleString()}\n\nTotal: ${formatMoney({ amount: order.total, currency: order.currency })}`
  return { subject: `New order — ${order.number} · ${formatMoney({ amount: order.total, currency: order.currency })}`, html, text }
}

export function testEmail(params?: { branding?: Partial<EmailBranding> }): Rendered {
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
    html: renderEmail(blocks, b, {}),
    text: renderText(blocks, b, {}),
  }
}

export function lowStockAlertEmail(params: {
  items: { name: string; slug: string; stock: number; threshold: number }[]
}): Rendered {
  const { items } = params
  const b = brand()
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

  const blocks: EmailBlock[] = [
    {
      id: "hero",
      type: "hero",
      eyebrow: "Inventory",
      heading: "Low stock alert",
      subheading: `${items.length} ${items.length === 1 ? "product needs" : "products need"} attention.`,
      imageUrl: "",
      align: "left",
    },
  ]
  const table = `<tr><td style="padding:20px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows}</table></td></tr>`
  const html = renderEmail(blocks, b, {}).replace(
    "<tr><td style=\"padding:0 28px 32px;\"></td></tr>",
    `${table}<tr><td style="padding:20px 28px 0;"><p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">Review inventory in the admin dashboard to restock or pause sales.</p></td></tr><tr><td style="padding:0 28px 32px;"></td></tr>`,
  )
  const text = `Low stock alert\n\n${items.map((i) => `${i.name} (${i.slug}) — ${i.stock} left, threshold ${i.threshold}`).join("\n")}`
  return { subject: `Low stock alert — ${items.length} ${items.length === 1 ? "product" : "products"}`, html, text }
}
