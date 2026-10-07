import type { Doc } from "../lib/domain/schema"

export const backInStockAlerts: Doc = {
  slug: "back-in-stock-alerts",
  title: "Back-in-Stock Alerts",
  category: "Catalog",
  audience: "content",
  access: "public",
  summary:
    "How shoppers ask to hear when a sold-out product returns, how you see that demand in the admin, and what happens when you restock: one email to each person waiting, sent once, with a one-click unsubscribe.",
  readingMinutes: 5,
  order: 2,
  updatedAt: "2026-10-07",
  tags: ["stock", "restock", "alerts", "waiting list", "demand", "email"],
  body: [
    {
      type: "paragraph",
      text: "When a product sells out, it stays on the store with a Notify me form instead of disappearing. Shoppers leave their email, you see how many people are waiting, and the moment you restock everyone on the list gets a single email telling them it is back. You never have to export a list or send anything by hand.",
    },
    { type: "heading", text: "What the shopper sees" },
    {
      type: "steps",
      items: [
        {
          title: "A sold-out product shows Notify me",
          text: "Add to cart is replaced by a short form asking for an email. It appears only on products that are on sale but have no stock left. A pre-order never shows it, because a pre-order is sold before stock exists.",
        },
        {
          title: "They join the list",
          text: "After submitting they see: \"You're on the list. We'll email you once, as soon as it's back.\" Signing in is not required, so guests can ask too.",
        },
        {
          title: "Asking twice does nothing extra",
          text: "There is one request per email per product. A repeat request shows the same message, so nobody gets duplicate emails and the form never reveals who is already waiting.",
        },
      ],
    },
    { type: "heading", text: "Seeing demand in the admin" },
    {
      type: "table",
      headers: ["Where", "What it shows"],
      rows: [
        ["Products table, Waiting column", "How many people are waiting for each product. Click the header to sort most wanted first."],
        ["Overview, Most wanted card", "The top three products by people waiting, plus the total across the store."],
        ["Sold-out tag", "A clear Sold out label on the product row, so the reason for the waiting count is obvious."],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Use the count to plan your next order",
      text: "Waiting only counts people who asked while the product was sold out and have not yet been emailed. Once the restock email goes out, the count drops back to zero.",
    },
    { type: "heading", text: "What happens when you restock" },
    {
      type: "steps",
      items: [
        {
          title: "Raise the stock above zero",
          text: "Edit the product's stock, or use the plus button in the Products table. An expired checkout that releases reserved stock counts as a restock too.",
        },
        {
          title: "The stock change is saved first",
          text: "The alert emails go out only after the new stock is saved. If email has a problem, your restock is never undone or blocked.",
        },
        {
          title: "Everyone waiting gets one email",
          text: "Each person gets the back-in-stock email once, with a link to the product. If one send fails, that person stays on the list and the next restock tries again.",
        },
      ],
    },
    {
      type: "heading",
      text: "Unsubscribing",
    },
    {
      type: "paragraph",
      text: "Every alert email has an unsubscribe link. It opens a confirmation page with a single button, so an email scanner that only opens the link changes nothing. Pressing the button removes that one request and nothing else. The link carries a random secret rather than the email address, and an unknown or used link gets the same polite answer, which keeps your waiting list private.",
    },
    { type: "heading", text: "Built-in protection" },
    {
      type: "list",
      items: [
        "Every request is validated on the server: a real email address and a product that is actually sold out.",
        "Requests have a rate limit of five a minute per visitor, which stops anyone filling the list with junk.",
        "Emails are stored in lower case so the same person is never counted twice.",
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "Related guides",
      text: "Stock settings live in /docs/managing-the-product-catalog. The email itself is described in /docs/email-templates-guide.",
    },
  ],
}
