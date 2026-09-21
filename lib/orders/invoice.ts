// Opens a clean, self-contained invoice document in a new window and triggers the
// browser print dialog (which also offers "Save as PDF"). Kept out of the React
// tree so it doesn't fight the app's print styles. When wired to a real backend,
// this can be replaced by a server-rendered PDF endpoint without touching callers.

import { formatMoney } from "@/lib/format"
import type { Order } from "./types"

interface BillTo {
  name: string
  email: string
}

export function printInvoice(order: Order, billTo: BillTo) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.color ? `<span class="muted"> — ${escapeHtml(item.color)}</span>` : ""}
          </td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatMoney({ amount: item.unitAmount, currency: item.currency })}</td>
          <td class="num">${formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}</td>
        </tr>`,
    )
    .join("")

  const date = new Date(order.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(order.number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #111; margin: 0; padding: 48px; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 24px; }
    .brand { font-weight: 800; letter-spacing: 0.3em; font-size: 20px; }
    h1 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.2em; color: #666; margin: 0 0 4px; }
    .meta { text-align: right; font-size: 13px; line-height: 1.6; }
    .meta strong { font-size: 16px; }
    .parties { display: flex; gap: 48px; margin: 32px 0; font-size: 14px; line-height: 1.6; }
    .parties h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #888; margin: 0 0 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; border-bottom: 1px solid #ddd; padding: 10px 8px; }
    td { padding: 12px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    .muted { color: #999; }
    .totals { margin-top: 16px; margin-left: auto; width: 260px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 8px; }
    .totals .grand { border-top: 2px solid #111; margin-top: 6px; font-weight: 700; font-size: 16px; }
    .foot { margin-top: 48px; font-size: 12px; color: #999; text-align: center; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">MOMO</div>
    </div>
    <div class="meta">
      <h1>Invoice</h1>
      <strong>${escapeHtml(order.number)}</strong><br />
      ${date}<br />
      <span class="muted">Status: ${order.status}</span>
    </div>
  </div>

  <div class="parties">
    <div>
      <h2>Billed to</h2>
      ${escapeHtml(billTo.name)}<br />
      ${escapeHtml(billTo.email)}
    </div>
    <div>
      <h2>From</h2>
      MOMO Audio<br />
      hello@momo-audio.com
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney({ amount: order.subtotal, currency: order.currency })}</span></div>
    <div><span>Shipping</span><span>${order.shipping === 0 ? "Free" : formatMoney({ amount: order.shipping, currency: order.currency })}</span></div>
    <div class="grand"><span>Total</span><span>${formatMoney({ amount: order.total, currency: order.currency })}</span></div>
  </div>

  <div class="foot">Thank you for your order. This is a demo invoice generated client-side.</div>

  <script>window.onload = function () { window.print(); }</script>
</body>
</html>`

  const win = window.open("", "_blank", "width=800,height=900")
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
