import type { Doc } from "../schema"

export const ordersAndEmailOperations: Doc = {
  slug: "orders-and-email-operations",
  title: "Orders & Email Operations",
  category: "Store Operations",
  audience: "content",
  access: "admin",
  summary:
    "Process orders through their lifecycle and manage the transactional emails customers receive.",
  readingMinutes: 6,
  order: 1,
  updatedAt: "2026-09-20",
  tags: ["admin", "orders", "fulfilment", "email", "notifications"],
  body: [
    {
      type: "paragraph",
      text: "Once customers start buying, two things need tending: moving orders through fulfilment, and making sure the emails around those orders go out correctly. Both live in the admin dashboard.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Admin-only. Open the Admin dashboard from the account menu with an admin account to manage orders and email.",
    },
    {
      type: "heading",
      text: "The order lifecycle",
    },
    {
      type: "table",
      headers: ["Status", "Meaning", "Your next action"],
      rows: [
        ["Pending", "Payment confirmed, not yet picked.", "Review and move to Processing."],
        ["Processing", "Being prepared for shipment.", "Pack the items and add tracking."],
        ["Shipped", "Handed to the carrier.", "No action — customer is notified automatically."],
        ["Delivered", "Marked complete.", "Close out; handle any follow-up requests."],
        ["Cancelled", "Order voided.", "Confirm any refund was issued."],
      ],
    },
    {
      type: "heading",
      text: "Updating an order",
    },
    {
      type: "steps",
      items: [
        "Open the Orders section and select the order.",
        "Move it to the next status as you fulfil it.",
        "Add tracking details when you mark it Shipped so the customer's notification includes them.",
        "Save — the customer receives the matching status email automatically.",
      ],
    },
    {
      type: "heading",
      text: "Low-stock alerts",
    },
    {
      type: "paragraph",
      text: "As orders come in, stock falls. The dashboard surfaces items that have dropped to low or zero stock so you can restock before they sell out. Treat these as your restock queue — clearing them keeps popular products purchasable.",
    },
    {
      type: "heading",
      text: "Customer email",
    },
    {
      type: "paragraph",
      text: "Transactional emails — order confirmations, shipping updates, and contact replies — are sent through the store's email service. From the admin side you manage the content and can trigger a test send to confirm everything looks right before a campaign or after a copy change.",
    },
    {
      type: "callout",
      variant: "tip",
      text: "After editing any email template, always send a test to yourself first. It's the quickest way to catch a broken link or a wrong merge field before a real customer sees it.",
    },
  ],
}
