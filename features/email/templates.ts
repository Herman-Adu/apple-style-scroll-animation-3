import { formatMoney } from "@/lib/format"
import type { Order } from "@/lib/orders/types"

/**
 * Plain HTML email templates. Kept as string builders (no react-email
 * dependency) so they render identically anywhere and stay easy to port to
 * Strapi-managed content later. Inline styles only — email clients ignore
 * <style> and external CSS.
 */

const BRAND = "#0a0a0a"
const MUTED = "#6b7280"
const BORDER = "#e5e7eb"

function layout(title: string, body: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="text-align:center;padding:8px 0 24px;">
        <span style="font-size:18px;font-weight:700;letter-spacing:0.35em;color:${BRAND};">MOMO</span>
      </div>
      <div style="background:#ffffff;border:1px solid ${BORDER};border-radius:16px;padding:32px;">
        <h1 style="margin:0 0 8px;font-size:20px;color:${BRAND};">${title}</h1>
        ${body}
      </div>
      <p style="text-align:center;color:${MUTED};font-size:12px;margin:24px 0 0;">
        MOMO Audio · London · Copenhagen · Accra · Tokyo
      </p>
    </div>
  </body>
</html>`
}

export function orderConfirmationEmail(params: { name: string; order: Order }): {
  subject: string
  html: string
  text: string
} {
  const { name, order } = params
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${BRAND};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.color} · Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${BRAND};font-size:14px;white-space:nowrap;">
          ${formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
        </td>
      </tr>`,
    )
    .join("")

  const html = layout(
    "Order confirmed",
    `
    <p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
      Thanks, ${name}. We&apos;ve received your order <strong style="color:${BRAND};">${order.number}</strong> and it&apos;s being prepared.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
      ${rows}
      <tr>
        <td style="padding:16px 0 0;color:${BRAND};font-size:15px;font-weight:700;">Total</td>
        <td style="padding:16px 0 0;text-align:right;color:${BRAND};font-size:15px;font-weight:700;">
          ${formatMoney({ amount: order.total, currency: order.currency })}
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">
      You can view this order and its invoice anytime under Orders in your account.
    </p>`,
  )

  const text = `Order confirmed — ${order.number}\n\nThanks, ${name}. We've received your order and it's being prepared.\n\n${order.items
    .map((i) => `${i.name} (${i.color}) x${i.quantity} — ${formatMoney({ amount: i.unitAmount * i.quantity, currency: i.currency })}`)
    .join("\n")}\n\nTotal: ${formatMoney({ amount: order.total, currency: order.currency })}`

  return { subject: `Order confirmed — ${order.number}`, html, text }
}

export function businessOrderNotificationEmail(params: { order: Order; customerName?: string }): {
  subject: string
  html: string
  text: string
} {
  const { order, customerName } = params
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${BRAND};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.color ?? ""}${item.color ? " · " : ""}Qty ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;color:${BRAND};font-size:14px;white-space:nowrap;">
          ${formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
        </td>
      </tr>`,
    )
    .join("")

  const discountRow =
    order.discount && order.discount > 0
      ? `
      <tr>
        <td style="padding:8px 0;color:#059669;font-size:13px;">Discount${
          order.appliedOffers && order.appliedOffers.length
            ? ` (${order.appliedOffers.map((o) => o.label).join(", ")})`
            : ""
        }</td>
        <td style="padding:8px 0;text-align:right;color:#059669;font-size:13px;white-space:nowrap;">
          −${formatMoney({ amount: order.discount, currency: order.currency })}
        </td>
      </tr>`
      : ""

  const html = layout(
    "New order received",
    `
    <p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
      A new order <strong style="color:${BRAND};">${order.number}</strong> was just placed${
        customerName ? ` by <strong style="color:${BRAND};">${customerName}</strong>` : ""
      }.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 8px;">
      <tr>
        <td style="padding:4px 0;color:${MUTED};font-size:13px;">Customer</td>
        <td style="padding:4px 0;text-align:right;color:${BRAND};font-size:13px;">${order.email}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:${MUTED};font-size:13px;">Placed</td>
        <td style="padding:4px 0;text-align:right;color:${BRAND};font-size:13px;">${new Date(order.createdAt).toLocaleString()}</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 0;">
      ${rows}
      <tr>
        <td style="padding:12px 0 0;color:${MUTED};font-size:13px;">Subtotal</td>
        <td style="padding:12px 0 0;text-align:right;color:${BRAND};font-size:13px;white-space:nowrap;">${formatMoney({ amount: order.subtotal, currency: order.currency })}</td>
      </tr>
      ${discountRow}
      <tr>
        <td style="padding:8px 0;color:${MUTED};font-size:13px;">Shipping</td>
        <td style="padding:8px 0;text-align:right;color:${BRAND};font-size:13px;white-space:nowrap;">${order.shipping === 0 ? "Free" : formatMoney({ amount: order.shipping, currency: order.currency })}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;color:${BRAND};font-size:15px;font-weight:700;">Total</td>
        <td style="padding:12px 0 0;text-align:right;color:${BRAND};font-size:15px;font-weight:700;white-space:nowrap;">${formatMoney({ amount: order.total, currency: order.currency })}</td>
      </tr>
    </table>
    <p style="margin:20px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">
      Manage this order in the admin dashboard under Orders.
    </p>`,
  )

  const text = `New order received — ${order.number}\n\n${customerName ? customerName + " · " : ""}${order.email}\nPlaced: ${new Date(order.createdAt).toLocaleString()}\n\n${order.items
    .map((i) => `${i.name}${i.color ? ` (${i.color})` : ""} x${i.quantity} — ${formatMoney({ amount: i.unitAmount * i.quantity, currency: i.currency })}`)
    .join("\n")}\n\nSubtotal: ${formatMoney({ amount: order.subtotal, currency: order.currency })}${
    order.discount && order.discount > 0 ? `\nDiscount: −${formatMoney({ amount: order.discount, currency: order.currency })}` : ""
  }\nShipping: ${order.shipping === 0 ? "Free" : formatMoney({ amount: order.shipping, currency: order.currency })}\nTotal: ${formatMoney({ amount: order.total, currency: order.currency })}`

  return { subject: `New order — ${order.number} · ${formatMoney({ amount: order.total, currency: order.currency })}`, html, text }
}

export function testEmail(): { subject: string; html: string; text: string } {
  const html = layout(
    "Test email",
    `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
      This is a test from your MOMO admin dashboard. If you're reading this, your Resend
      configuration and sending domain are working correctly.
    </p>`,
  )
  return {
    subject: "MOMO — email configuration test",
    html,
    text: "This is a test from your MOMO admin dashboard. Your email configuration is working correctly.",
  }
}

export function lowStockAlertEmail(params: {
  items: { name: string; slug: string; stock: number; threshold: number }[]
}): { subject: string; html: string; text: string } {
  const { items } = params
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};color:${BRAND};font-size:14px;">
          ${item.name}<br /><span style="color:${MUTED};font-size:12px;">${item.slug}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDER};text-align:right;font-size:14px;white-space:nowrap;">
          <span style="color:${item.stock === 0 ? "#dc2626" : "#d97706"};font-weight:600;">${item.stock} left</span>
          <br /><span style="color:${MUTED};font-size:12px;">threshold ${item.threshold}</span>
        </td>
      </tr>`,
    )
    .join("")

  const html = layout(
    "Low stock alert",
    `
    <p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.6;">
      The following ${items.length === 1 ? "product has" : "products have"} dropped to or below the low-stock threshold and may need restocking.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:8px 0 0;">${rows}</table>
    <p style="margin:20px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">
      Review inventory in the admin dashboard to restock or pause sales.
    </p>`,
  )

  const text = `Low stock alert\n\n${items
    .map((i) => `${i.name} (${i.slug}) — ${i.stock} left, threshold ${i.threshold}`)
    .join("\n")}`

  return {
    subject: `Low stock alert — ${items.length} ${items.length === 1 ? "product" : "products"}`,
    html,
    text,
  }
}
