import type { EmailBranding } from "./types"

/**
 * Pure, client-safe sample data for live previews in the admin builder. Mirrors
 * the real token set so previews look like a genuine send. NOT used at send time
 * — real sends fill tokens from the order/customer/campaign context.
 */
export function sampleVars(branding: EmailBranding): Record<string, string> {
  return {
    customer_name: "Ada Lovelace",
    brand_name: branding.brandName || "MOMO",
    order_number: "MOMO-1024",
    shop_url: "/products",
    offer_headline: "15% off",
    offer_label: "Welcome offer",
    offer_expiry: "Valid until 31 December 2026.",
  }
}

/** Sample order-summary table so the dynamic block renders in previews. */
export const SAMPLE_ORDER_SUMMARY = `
<tr><td style="padding:20px 28px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#0a0a0a;font-size:14px;">MOMO Reference One<br /><span style="color:#6b7280;font-size:12px;">Midnight · Qty 1</span></td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#0a0a0a;font-size:14px;white-space:nowrap;">£349.00</td>
    </tr>
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;color:#0a0a0a;font-size:14px;">MOMO Buds Pro<br /><span style="color:#6b7280;font-size:12px;">Graphite · Qty 1</span></td>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#0a0a0a;font-size:14px;white-space:nowrap;">£199.00</td>
    </tr>
    <tr><td style="padding:14px 0 0;color:#6b7280;font-size:13px;">Subtotal</td><td style="padding:14px 0 0;text-align:right;color:#6b7280;font-size:13px;white-space:nowrap;">£548.00</td></tr>
    <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Shipping</td><td style="padding:8px 0;text-align:right;color:#6b7280;font-size:13px;white-space:nowrap;">Free</td></tr>
    <tr><td style="padding:12px 0 0;color:#0a0a0a;font-size:15px;font-weight:700;">Total</td><td style="padding:12px 0 0;text-align:right;color:#0a0a0a;font-size:15px;font-weight:700;white-space:nowrap;">£548.00</td></tr>
  </table>
</td></tr>`
