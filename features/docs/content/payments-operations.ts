import type { Doc } from "../lib/domain/schema"

export const paymentsOperations: Doc = {
  slug: "payments-operations-refunds-reconciliation",
  title: "Managing Payments, Refunds & Reconciliation",
  category: "Orders & Fulfillment",
  audience: "content",
  access: "public",
  summary:
    "The operational side of payments: where money actually lives, how an order becomes 'processing', how to issue a refund correctly, and how to reconcile the Stripe Dashboard against the store's own orders so the two never drift.",
  readingMinutes: 10,
  order: 1,
  updatedAt: "2026-10-04",
  tags: ["payments", "refunds", "reconciliation", "orders", "stripe", "operations"],
  body: [
    {
      type: "paragraph",
      text: "This is the day-to-day companion to the developer guide 'Stripe Payments & Webhooks'. You do not need to read code to run payments — but you do need to know where money lives, what each order status means, and how to keep the store's records and Stripe in agreement. That is what this guide covers.",
    },
    {
      type: "callout",
      variant: "info",
      title: "Two systems, one truth",
      text: "Stripe holds the money and the payment record; the store holds the order. They are linked by a Stripe session id stored on every paid order. When something looks off, that link is how you match a payment to an order and back again.",
    },
    {
      type: "heading",
      text: "How a payment becomes an order",
    },
    {
      type: "paragraph",
      text: "When a customer pays, Stripe notifies the store and the order is created automatically with the status 'processing'. You do not create orders by hand. The customer receives a confirmation email at the same moment, and the order appears in their account under Orders & invoices. Stock was already set aside the moment they started checkout, so a paid order is always fulfillable.",
    },
    {
      type: "table",
      title: "Order statuses and what they mean",
      headers: ["Status", "Meaning", "Typical next step"],
      rows: [
        ["Processing", "Paid and awaiting fulfillment. The default for a new paid order.", "Pick, pack, and ship; then mark fulfilled."],
        ["Fulfilled", "Shipped or delivered to the customer.", "No action unless a return is requested."],
        ["Cancelled", "Order stopped before fulfillment.", "Refund if the customer was charged."],
        ["Refunded", "Money returned to the customer via Stripe.", "Keep for records; stock is not auto-restored."],
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "Abandoned checkouts clean themselves up",
      text: "If a customer starts checkout but never pays, no order is created and the stock that was set aside is automatically released when the checkout expires. You will not see phantom orders for abandoned carts.",
    },
    {
      type: "heading",
      text: "Issuing a refund",
    },
    {
      type: "paragraph",
      text: "Refunds are issued in the Stripe Dashboard — that is where the money is. The store's order status is a record that should be updated to match. Always refund in Stripe first, then reflect it on the order, never the other way around.",
    },
    {
      type: "steps",
      items: [
        { title: "Find the payment", text: "In the Stripe Dashboard, open Payments and search by the customer email or the order's Stripe session id." },
        { title: "Refund in Stripe", text: "Use Refund — full or partial. Stripe returns the money to the original card and records the refund." },
        { title: "Update the order", text: "Set the store order to 'Refunded' (or 'Cancelled' if it was never shipped) so the customer's account and your reports agree with Stripe." },
        { title: "Check stock", text: "A refund does not automatically put the item back in stock. If the product is returning to inventory, adjust its stock in the catalog manually." },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Refunds do not restock automatically",
      text: "Reserved stock is only auto-released for checkouts that were never paid. Once an order is paid, its stock is committed — refunding the payment will not add the unit back. Decide deliberately whether a refunded item re-enters inventory and adjust the catalog if so.",
    },
    {
      type: "heading",
      text: "Reconciliation: keeping Stripe and the store in agreement",
    },
    {
      type: "paragraph",
      text: "Reconciliation is the routine of confirming that every payment in Stripe has a matching order in the store, and every paid order in the store has a matching payment in Stripe. Because orders are created by Stripe's webhook, the two are almost always in lockstep — but a missed webhook or a manual change can cause drift, and a periodic check catches it early.",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — The reconciliation loop",
      caption: "Match both directions; investigate anything that appears on only one side.",
      diagram: `flowchart TD
    A[Stripe payments for the period] --> C{Match by session id / email}
    B[Store orders for the period] --> C
    C -->|Matched| D[OK - no action]
    C -->|In Stripe, not in store| E[Missed webhook: replay event]
    C -->|In store, not in Stripe| F[Investigate: manual/incorrect order]
    C -->|Amounts differ| G[Check partial refund or currency]`,
    },
    {
      type: "table",
      title: "Common discrepancies and their cause",
      headers: ["Symptom", "Likely cause", "Fix"],
      rows: [
        ["Payment in Stripe but no order", "A webhook delivery was missed or failed.", "Resend the event from the Stripe Dashboard; the order is created on redelivery."],
        ["Order marked paid but no Stripe payment", "Order created or edited manually.", "Confirm it was legitimate; correct the status if not."],
        ["Amounts don't match", "Partial refund, or a currency display mismatch.", "Check the refund history on the payment in Stripe."],
        ["Duplicate-looking orders", "Two are not actually duplicates — each paid session is unique.", "Confirm distinct Stripe session ids before acting."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Let Stripe retry before you intervene",
      text: "If an order hasn't appeared moments after a payment, wait a little — Stripe automatically retries webhook delivery with backoff, and the order will usually appear on its own. Only resend the event manually if it is still missing after retries.",
    },
    {
      type: "heading",
      text: "Test mode vs live",
    },
    {
      type: "paragraph",
      text: "Stripe has separate test and live environments with separate dashboards and separate payments. While the store is running against test keys, every 'payment' is simulated and no real money moves — useful for rehearsing this whole flow end to end. When reconciling, make sure you are looking at the same mode (test or live) that the store is currently using, or payments will appear to be missing simply because you are in the wrong dashboard.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Branding the payment page",
      text: "The business name, logo, and colors on the Stripe payment page come from the Stripe Dashboard under Settings, Business, Branding — not from the store. Update them there and they apply to Checkout automatically. Set them in the same mode (test or live) whose keys the store is using.",
    },
  ],
}
