import type { Doc } from "../schema"

export const commerceCartCheckout: Doc = {
  slug: "commerce-cart-checkout-architecture",
  title: "The Shopping Cart & Checkout Architecture",
  category: "Commerce",
  summary:
    "How a server-first storefront handles a fundamentally client-side thing — the cart — plus the checkout flow and the server-side validation that protects it.",
  readingMinutes: 12,
  order: 1,
  updatedAt: "2026-09-17",
  tags: ["cart", "checkout", "state", "server actions", "validation"],
  body: [
    {
      type: "paragraph",
      text: "A cart is the hardest thing to keep server-first, because it is inherently interactive and personal. The pattern here: the catalog stays fully server-rendered, the cart is a small client island backed by a single context, and every money-touching decision is re-validated on the server. The client cart is a convenience; the server is the source of truth.",
    },
    {
      type: "heading",
      text: "Where cart state lives",
    },
    {
      type: "paragraph",
      text: "The cart is one client context mounted high in the tree, persisted to storage for continuity across reloads. Product cards and pages stay server components — the only client parts are the Add-to-cart button and the cart drawer. Nothing about the catalog crosses the client boundary just because a cart exists.",
    },
    {
      type: "mermaid",
      kind: "state",
      title: "Figure 1 — Cart lifecycle",
      caption: "The client cart moves through these states; checkout hands off to the server.",
      diagram: `stateDiagram-v2
    [*] --> Empty
    Empty --> Active: add item
    Active --> Active: update qty
    Active --> Empty: remove last item
    Active --> Validating: checkout
    Validating --> Active: validation error
    Validating --> Redirecting: server ok
    Redirecting --> [*]: payment provider`,
    },
    {
      type: "heading",
      text: "Adding to the cart",
    },
    {
      type: "mermaid",
      kind: "sequence",
      title: "Figure 2 — Add to cart and open drawer",
      caption: "The button island updates context; the server catalog is never re-fetched.",
      diagram: `sequenceDiagram
    participant U as User
    participant B as AddToCart (island)
    participant Ctx as Cart context
    participant D as Cart drawer (island)
    U->>B: Click "Add"
    B->>Ctx: addItem(slug, qty)
    Ctx->>Ctx: merge + persist to storage
    Ctx-->>D: state updates
    D-->>U: Drawer opens with line item`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Never trust the client cart for price",
      text: "The client cart holds slugs and quantities for display. It must never be the basis for a charge. At checkout the server re-looks-up every price from the source of truth and recomputes the total. A tampered client payload cannot change what the customer is charged.",
    },
    {
      type: "heading",
      text: "Checkout validation",
    },
    {
      type: "paragraph",
      text: "Checkout runs as a server action. It validates the payload shape with zod, recomputes the order total from server-side prices, enforces quantity caps across the whole order, and only then creates the payment session with an idempotency key so a retry cannot double-charge.",
    },
    {
      type: "code",
      language: "typescript",
      title: "app/checkout/actions.ts — the trust boundary",
      code: `"use server"

const CheckoutSchema = z.object({
  items: z.array(z.object({
    slug: z.string(),
    quantity: z.number().int().positive().max(10),
  })).min(1).max(50),
})

export async function checkout(input: unknown) {
  const { items } = CheckoutSchema.parse(input)         // shape
  const products = await fetchProductsBySlugs(items.map(i => i.slug))
  const total = items.reduce((sum, i) => {
    const p = products.find(p => p.slug === i.slug)
    if (!p) throw new Error("Unknown product")          // reject junk
    return sum + p.price * i.quantity                   // server price
  }, 0)
  return createCheckoutSession({ total, items }, { idempotencyKey: hash(items) })
}`,
    },
    {
      type: "steps",
      items: [
        { title: "Validate shape", text: "zod rejects malformed or oversized payloads before any logic runs." },
        { title: "Re-price server-side", text: "Prices come from the catalog, never from the request body." },
        { title: "Enforce aggregate caps", text: "Quantity limits apply across the order, not per line item." },
        { title: "Idempotent creation", text: "An idempotency key keyed on the cart makes retries safe." },
      ],
    },
    {
      type: "chart",
      chartType: "area",
      title: "Figure 3 — Checkout funnel",
      caption: "Illustrative conversion through the flow; the biggest drop is the add-to-cart step.",
      unit: "%",
      xKey: "stage",
      data: [
        { stage: "View product", pct: 100 },
        { stage: "Add to cart", pct: 42 },
        { stage: "Open checkout", pct: 31 },
        { stage: "Payment", pct: 24 },
        { stage: "Complete", pct: 21 },
      ],
      series: [{ key: "pct", label: "Reaching stage", color: "var(--color-chart-2)" }],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Payments belong to a provider",
      text: "Do not build your own card handling. Use a payment provider's hosted or embedded checkout so card data never touches your server, and keep the server action responsible only for pricing and session creation.",
    },
  ],
}
