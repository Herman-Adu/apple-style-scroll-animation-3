import type { Doc } from "../schema"

export const ordersAndFulfillment: Doc = {
  slug: "orders-and-fulfillment",
  title: "Orders & Fulfillment",
  category: "Orders & Fulfillment",
  audience: "content",
  access: "admin",
  summary:
    "Work the order queue day to day — filter by status, open an order to see its lines and total, and move it through the processing → fulfilled lifecycle, plus how cancellations and refunds fit in.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["admin", "orders", "fulfillment", "status", "refunds", "stripe"],
  body: [
    {
      type: "paragraph",
      text: "The Orders screen is the operational heart of the store — every checkout lands here as an order you can track and progress. This guide covers the queue, the order detail view, and the status lifecycle. It pairs with the 'Orders & Email Operations' guide, which focuses on the customer emails that fire alongside these steps.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Admin-only. Open the dashboard and choose Orders from the sidebar. Payment and card details are never stored here — Stripe owns them; the dashboard only reflects order state.",
    },
    {
      type: "heading",
      text: "The order queue",
    },
    {
      type: "paragraph",
      text: "Orders are listed newest-first in a single table. Each row shows the order number, item count, customer email, date, total, and current status, with an inline status selector on the right so you can progress an order without leaving the list.",
    },
    {
      type: "table",
      title: "Queue columns",
      headers: ["Column", "What it shows"],
      rows: [
        ["Order", "The order number and how many items it contains."],
        ["Customer", "The email the order was placed with."],
        ["Date", "When the order was created."],
        ["Total", "Order value, in the order's currency."],
        ["Status", "The current lifecycle state as a colored badge."],
        ["Set status", "Inline selector to change the status in place."],
      ],
    },
    {
      type: "heading",
      text: "Filtering by status",
    },
    {
      type: "paragraph",
      text: "The filter pills above the table narrow the queue to a single state, so you can focus on what needs action. 'Processing' is your work queue; the others are for reference and reconciliation.",
    },
    {
      type: "list",
      items: [
        "All orders — the full history, newest first.",
        "Processing — paid and awaiting fulfillment. This is your daily to-do list.",
        "Fulfilled — dispatched and complete.",
        "Cancelled — stopped before fulfillment.",
        "Refunded — money returned to the customer.",
      ],
    },
    {
      type: "heading",
      text: "Opening an order",
    },
    {
      type: "paragraph",
      text: "Click any row to slide out the order detail panel. It shows the full line items — quantity, product, colour, and line total — the order total, and a status selector. Everything you need to pick, pack, and progress the order is in one place.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Review the lines",
          text: "Check each item, quantity, and variant against what you're about to pack. The panel mirrors exactly what the customer ordered.",
        },
        {
          title: "Confirm the total",
          text: "The total is computed from the line items in the order's currency — a quick sanity check before dispatch.",
        },
        {
          title: "Set the status",
          text: "Use the status selector in the panel (or the inline one in the row) to move the order forward. A confirmation toast appears when it saves.",
        },
      ],
    },
    {
      type: "heading",
      text: "The status lifecycle",
    },
    {
      type: "paragraph",
      text: "Every order sits in exactly one of four states. Moving an order to a new state is the single action that drives fulfillment — and, where configured, the matching customer email.",
    },
    {
      type: "table",
      title: "Order statuses",
      headers: ["Status", "Meaning", "Typical next step"],
      rows: [
        ["Processing", "Payment captured, awaiting dispatch.", "Pick, pack, then mark Fulfilled."],
        ["Fulfilled", "Dispatched to the customer.", "None — the order is complete."],
        ["Cancelled", "Stopped before dispatch.", "Refund if payment was taken."],
        ["Refunded", "Payment returned to the customer.", "None — reconcile in Stripe."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      text: "Work the Processing filter top to bottom each day. Marking an order Fulfilled is the moment it counts as shipped, so keep it in step with the parcel actually leaving.",
    },
    {
      type: "heading",
      text: "Cancellations & refunds",
    },
    {
      type: "paragraph",
      text: "Cancelling stops an order that hasn't shipped; refunding returns the money. The dashboard records the state change, but the money movement itself happens in Stripe — the two should always agree.",
    },
    {
      type: "callout",
      variant: "warning",
      text: "Always issue the actual refund in Stripe as well as setting the order to Refunded here. Changing the status alone records intent; it does not move money. Keeping the dashboard and Stripe in sync is what keeps your books accurate.",
    },
    {
      type: "callout",
      variant: "info",
      text: "Order data currently lives in the app's local demo layer. After the server-side migration it moves to the database and reads exactly the same way — the workflow on this screen does not change.",
    },
  ],
}
