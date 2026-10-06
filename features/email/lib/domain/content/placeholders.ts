/**
 * Single source of truth for the {{placeholders}} templates can use. Pure and
 * client-safe: drives the editor's picker, typo warnings and preview samples.
 * Real sends still fill values from the order/customer/campaign context.
 */

export type PlaceholderGroup = "Customer" | "Order" | "Product" | "Offer" | "Refund" | "Links" | "Brand"

export type Placeholder = {
  key: string
  label: string
  group: PlaceholderGroup
  sample: string
}

export const PLACEHOLDER_GROUPS: PlaceholderGroup[] = ["Customer", "Order", "Product", "Offer", "Refund", "Links", "Brand"]

export const PLACEHOLDERS: Placeholder[] = [
  { key: "customer_name", label: "Customer name", group: "Customer", sample: "Ada Lovelace" },
  { key: "customer_email", label: "Customer email", group: "Customer", sample: "ada@example.com" },
  { key: "order_number", label: "Order number", group: "Order", sample: "MOMO-1024" },
  { key: "total", label: "Order total", group: "Order", sample: "£548.00" },
  { key: "item_count", label: "Item count", group: "Order", sample: "2" },
  { key: "placed_at", label: "Order date", group: "Order", sample: "2 October 2026" },
  { key: "offer_headline", label: "Offer headline", group: "Offer", sample: "15% off" },
  { key: "offer_label", label: "Offer label", group: "Offer", sample: "Welcome offer" },
  { key: "offer_expiry", label: "Offer expiry line", group: "Offer", sample: "Valid until 31 December 2026." },
  { key: "amount", label: "Refund amount", group: "Refund", sample: "£199.00" },
  { key: "refund_eyebrow", label: "Refund eyebrow", group: "Refund", sample: "Refund issued" },
  { key: "refund_subheading", label: "Refund subheading", group: "Refund", sample: "Order MOMO-1024 has been refunded." },
  { key: "refund_note", label: "Refund note", group: "Refund", sample: "Funds usually arrive within 5–10 working days." },
  { key: "shop_url", label: "Shop link", group: "Links", sample: "/products" },
  { key: "order_url", label: "Order link", group: "Links", sample: "/account?tab=orders" },
  { key: "admin_url", label: "Admin link", group: "Links", sample: "/admin/orders" },
  { key: "brand_name", label: "Brand name", group: "Brand", sample: "MOMO" },
  { key: "product_name", label: "Product name", group: "Product", sample: "Momo X" },
  { key: "product_url", label: "Product link", group: "Links", sample: "/products/momo-x" },
  { key: "unsubscribe_url", label: "Unsubscribe link", group: "Links", sample: "/stock-alerts/unsubscribe?token=abc" },
]

const KNOWN = new Set(PLACEHOLDERS.map((p) => p.key))
const TOKEN_RE = /\{\{\s*([\w.]+)\s*\}\}/g

export const placeholderToken = (key: string) => `{{${key}}}`

export function placeholderSamples(overrides: Record<string, string> = {}): Record<string, string> {
  return { ...Object.fromEntries(PLACEHOLDERS.map((p) => [p.key, p.sample])), ...overrides }
}

export function findPlaceholderKeys(text: string): string[] {
  const seen: string[] = []
  for (const m of String(text ?? "").matchAll(TOKEN_RE)) {
    if (!seen.includes(m[1])) seen.push(m[1])
  }
  return seen
}

/** Insert text at a selection (or append when unknown), returning the new value and caret. */
export function insertAtSelection(
  value: string,
  start: number | null,
  end: number | null,
  insert: string,
): { value: string; caret: number } {
  const len = value.length
  const s = start == null ? len : Math.min(Math.max(start, 0), len)
  const e = end == null ? s : Math.min(Math.max(end, s), len)
  return { value: value.slice(0, s) + insert + value.slice(e), caret: s + insert.length }
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return row[b.length]
}

/** Closest known key within 2 edits, or null. */
export function suggestPlaceholder(key: string): string | null {
  let best: string | null = null
  let bestDist = 3
  for (const known of KNOWN) {
    const d = distance(key, known)
    if (d < bestDist) {
      best = known
      bestDist = d
    }
  }
  return best
}

export function unknownPlaceholders(text: string): { key: string; suggestion: string | null }[] {
  return findPlaceholderKeys(text)
    .filter((k) => !KNOWN.has(k))
    .map((key) => ({ key, suggestion: suggestPlaceholder(key) }))
}
