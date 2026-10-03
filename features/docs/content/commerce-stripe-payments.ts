import type { Doc } from "../lib/schema"

export const commerceStripePayments: Doc = {
  slug: "commerce-stripe-payments-and-webhooks",
  title: "Stripe Payments & Webhooks",
  category: "Commerce",
  audience: "developer",
  access: "public",
  summary:
    "How this storefront actually charges a card: embedded Checkout created from a server action, stock reserved up front, and a signature-verified webhook that materializes the order and sends email. The concrete, code-level companion to the cart architecture guide.",
  readingMinutes: 14,
  order: 2,
  updatedAt: "2026-09-29",
  tags: ["stripe", "checkout", "webhooks", "payments", "server actions", "idempotency"],
  body: [
    {
      type: "paragraph",
      text: "The cart guide covers the trust boundary in the abstract — this one is the concrete wiring. Payment runs on Stripe embedded Checkout: card data never touches our servers, our server action is responsible only for pricing and session creation, and a webhook is the single source of truth that turns a paid session into a real order. Everything money-related is server-side and re-validated; the client only ever holds slugs and quantities for display.",
    },
    {
      type: "callout",
      variant: "info",
      title: "The one rule that shapes the whole flow",
      text: "The browser is never trusted to say an order is paid. The Checkout return page is a UX convenience; the webhook is what actually creates the order. This is why stock is reserved before payment and the order is materialized after — from Stripe's server, not the customer's.",
    },
    {
      type: "heading",
      text: "The moving parts",
    },
    {
      type: "list",
      items: [
        "features/checkout/actions.ts — the server action that reserves stock and creates the Checkout Session.",
        "features/checkout/lib/stripe-line-items.ts — maps cart lines to Stripe line items (with absolute product image URLs).",
        "lib/stripe/server.ts — the server-only Stripe client, keyed by STRIPE_SECRET_KEY.",
        "app/api/stripe/webhook/route.ts — the signature-verified endpoint Stripe calls.",
        "lib/orders/checkout-finalize.ts — shared, transaction-aware reserve / finalize / release mechanics.",
        "app/checkout/return/page.tsx — the post-payment confirmation screen.",
      ],
    },
    {
      type: "heading",
      text: "End-to-end flow",
    },
    {
      type: "mermaid",
      kind: "sequence",
      title: "Figure 1 — From Pay to a confirmed order",
      caption:
        "Stock is reserved at session creation; the webhook (not the browser) finalizes the order and triggers email.",
      diagram: `sequenceDiagram
    participant U as Customer
    participant A as Checkout action (server)
    participant DB as Database
    participant S as Stripe
    participant W as Webhook route
    U->>A: Checkout (cart payload)
    A->>A: zod validate + re-price server-side
    A->>DB: reserve stock (pendingCheckout)
    A->>S: create Checkout Session (idempotencyKey)
    S-->>U: redirect to embedded Checkout
    U->>S: pay
    S->>W: checkout.session.completed (signed)
    W->>W: constructEventAsync verifies signature
    W->>DB: finalizeCheckout -> Order (processing)
    W->>U: order confirmation email
    U->>A: lands on /checkout/return`,
    },
    {
      type: "heading",
      text: "1. Creating the session (server action)",
    },
    {
      type: "paragraph",
      text: "Checkout is a server action, never a client fetch. It re-prices every line from the catalog, reserves stock inside a transaction, and only then creates the Stripe session — passing an idempotency key so a double-submit or retry cannot create two sessions or charge twice. The pending checkout id is stored in the session metadata; that id is the thread the webhook later pulls to finalize.",
    },
    {
      type: "code",
      language: "typescript",
      title: "features/checkout/actions.ts — reserve, then create the session",
      code: `"use server"

// 1. Validate + re-price on the server (never trust client prices).
// 2. Reserve stock in a transaction so we never sell what we can't fulfil.
// 3. Create the Stripe session with an idempotency key.
const session = await stripe.checkout.sessions.create(
  {
    mode: "payment",
    ui_mode: "embedded",
    line_items: toStripeLineItems(lines, origin),
    customer_email: email,
    return_url: returnUrl,
    metadata: { pendingCheckoutId: pending.id },
  },
  { idempotencyKey: pending.id },
)`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Reserve before you charge",
      text: "Stock is decremented at session creation (a reservation), not when the order is finalized. If the customer abandons or the payment fails, the checkout.session.expired / async_payment_failed webhook releases the reservation. This is what makes overselling impossible even across concurrent checkouts.",
    },
    {
      type: "heading",
      text: "2. Line items and product images",
    },
    {
      type: "paragraph",
      text: "Stripe renders the product name, price, and image on the hosted Checkout page. Stripe rejects relative URLs, so the line-item mapper promotes each product image to an absolute HTTPS URL using the request origin; anything that can't be made absolute is omitted rather than sent as a broken relative path.",
    },
    {
      type: "code",
      language: "typescript",
      title: "features/checkout/lib/stripe-line-items.ts — absolute image URLs",
      code: `function absoluteImageUrl(src: string, origin: string): string | undefined {
  if (!src) return undefined
  if (src.startsWith("http://") || src.startsWith("https://")) return src
  if (!origin) return undefined            // can't absolutize -> omit
  return new URL(src, origin).toString()   // /products/x.png -> https://host/products/x.png
}`,
    },
    {
      type: "heading",
      text: "3. The webhook is the source of truth",
    },
    {
      type: "paragraph",
      text: "Stripe calls our endpoint for every payment lifecycle event. The route pins the Node runtime and reads the raw request body — the signature is computed over the exact bytes, so any framework body-parsing would break verification. It verifies the signature with STRIPE_WEBHOOK_SECRET before trusting a single field.",
    },
    {
      type: "code",
      language: "typescript",
      title: "app/api/stripe/webhook/route.ts — verify first, then act",
      code: `export const runtime = "nodejs"        // crypto + raw body
export const dynamic = "force-dynamic"

const payload = await req.text()       // raw bytes, not parsed JSON
const event = await stripe.webhooks.constructEventAsync(
  payload,
  req.headers.get("stripe-signature")!,
  env.STRIPE_WEBHOOK_SECRET,
)

switch (event.type) {
  case "checkout.session.completed":
  case "checkout.session.async_payment_succeeded": {
    const session = event.data.object
    if (session.payment_status === "paid") {
      const order = await finalizeCheckout(session)
      if (order) await dispatchOrderEmails(order)
    }
    break
  }
  case "checkout.session.expired":
  case "checkout.session.async_payment_failed":
    await releaseCheckout(event.data.object) // restore reserved stock
    break
}`,
    },
    {
      type: "callout",
      variant: "tip",
      title: "Return 200 fast, 500 to retry",
      text: "A verified event that we handled returns 200. A transient handler failure returns 500 so Stripe retries with backoff. A bad signature returns 400 and is never retried. Never do slow work before returning — Stripe times out webhook deliveries.",
    },
    {
      type: "heading",
      text: "4. Finalize: idempotent by construction",
    },
    {
      type: "paragraph",
      text: "Webhooks are at-least-once — the same checkout.session.completed can arrive more than once. Finalization is safe under redelivery because it is guarded two ways: the pending row must still be in the reserved state, and Order.stripeSessionId is unique. A second delivery finds the pending row already completed and becomes a no-op. Because stock was reserved at session creation, finalize materializes the order without decrementing again.",
    },
    {
      type: "code",
      language: "typescript",
      title: "lib/orders/checkout-finalize.ts — guarded finalize",
      code: `const created = await prisma.$transaction(async (tx) => {
  const pending = await tx.pendingCheckout.findUnique({ where: { id: pendingId } })
  if (!pending || pending.status !== "reserved") return null  // already handled

  const number = await nextOrderNumber(tx)                    // MOMO-2026-0001
  const row = await tx.order.create({
    data: { /* ...pending totals... */ status: "processing", stripeSessionId: session.id },
    select: orderSelect,
  })
  await tx.pendingCheckout.update({ where: { id: pendingId }, data: { status: "completed" } })
  return row
})`,
    },
    {
      type: "steps",
      items: [
        { title: "Verify", text: "Reject anything without a valid Stripe signature before reading the body." },
        { title: "Match", text: "Look up the pending checkout by the id stored in session metadata." },
        { title: "Guard", text: "Only act if the pending row is still 'reserved' — redelivery is a no-op." },
        { title: "Materialize", text: "Create the Order (status 'processing') and mark the pending row completed, in one transaction." },
        { title: "Notify", text: "Send the confirmation email after the order row is committed." },
      ],
    },
    {
      type: "heading",
      text: "5. The return page",
    },
    {
      type: "paragraph",
      text: "The customer is redirected to /checkout/return after paying. It's possible the webhook has not landed in the few hundred milliseconds it takes to redirect, so the page reads the order by Stripe session id and shows the confirmed order number when it exists, degrading gracefully to a 'payment received, confirmation on its way' state otherwise. It never creates the order itself — that would duplicate the webhook and can't be trusted.",
    },
    {
      type: "heading",
      text: "Environment & configuration",
    },
    {
      type: "table",
      title: "Stripe environment variables",
      headers: ["Variable", "Where", "Purpose"],
      rows: [
        ["STRIPE_SECRET_KEY", "Server only", "Authenticates the Stripe SDK to create sessions and read objects."],
        ["STRIPE_WEBHOOK_SECRET", "Server only", "Verifies inbound webhook signatures. Unique per endpoint."],
        ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "Client", "Mounts the embedded Checkout UI in the browser."],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Test vs live keys must match the webhook secret",
      text: "The webhook secret is tied to a specific endpoint in a specific mode. If the secret key is in test mode but the webhook secret is from the live endpoint (or vice versa), signature verification fails on every event and no orders are ever created. Keep all three values in the same mode.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Planned: in-code payment styling (Payment Element)",
      text: "Embedded Checkout takes its branding (business name, logo, colors) from the Stripe Dashboard, not from code. Full in-code control of the payment form's look requires migrating to the Stripe Payment Element, which supports an appearance API. That migration is planned and tracked separately; this guide documents the embedded Checkout flow as it exists today.",
    },
  ],
}
