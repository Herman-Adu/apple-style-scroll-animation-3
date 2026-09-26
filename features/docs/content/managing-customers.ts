import type { Doc } from "../schema"

export const managingCustomers: Doc = {
  slug: "managing-customers",
  title: "Managing Customers",
  category: "Customers",
  audience: "content",
  access: "admin",
  summary:
    "Understand and act on your customer base — read the KPI row, segment and search the list, and open a profile to see lifetime value, order history, and to grant offers, manage roles, or block an account.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["admin", "customers", "segments", "offers", "roles", "lifetime value"],
  body: [
    {
      type: "paragraph",
      text: "The Customers screen turns raw accounts into something you can act on: who your best customers are, what they've bought, and the levers you have to look after them. This guide covers the list view, the customer profile, and the account controls an admin can use.",
    },
    {
      type: "callout",
      variant: "note",
      text: "Admin-only. Open the dashboard and choose Customers from the sidebar. Card numbers, billing details, and payment methods are handled by Stripe — they are never stored in or shown by this dashboard.",
    },
    {
      type: "heading",
      text: "The KPI row",
    },
    {
      type: "paragraph",
      text: "Four cards at the top summarise the base at a glance, recalculated live from the current records.",
    },
    {
      type: "table",
      title: "Customer KPIs",
      headers: ["Card", "What it measures"],
      rows: [
        ["Customers", "Total accounts, with how many are currently active."],
        ["Lifetime revenue", "All-time revenue, with the number of paying customers."],
        ["Avg. per customer", "Lifetime revenue divided across the base."],
        ["Newsletter", "How many customers are subscribed to marketing."],
      ],
    },
    {
      type: "heading",
      text: "Finding customers",
    },
    {
      type: "paragraph",
      text: "Three controls work together to narrow the table: segment pills, free-text search, and a sort selector. Segments are reflected in the URL, so a filtered view can be bookmarked or shared with a colleague.",
    },
    {
      type: "list",
      items: [
        "Segments — quick filters that group customers (for example by activity or value).",
        "Search — match on name or email as you type.",
        "Sort — Newest, Top spend, Most orders, or Name A–Z.",
      ],
    },
    {
      type: "paragraph",
      text: "The table lists each customer with their avatar, name, role, email, account status, order count, lifetime spend, any active offers, and when they joined. Click a row to open the full profile.",
    },
    {
      type: "heading",
      text: "The customer profile",
    },
    {
      type: "paragraph",
      text: "The profile page is the complete picture of one customer: a header with quick actions, a stats row, their personal offers and account preferences, and their full purchase and order history.",
    },
    {
      type: "table",
      title: "Profile sections",
      headers: ["Section", "What it holds"],
      rows: [
        ["Header", "Name, role, status, member-since date, and the Email / role / block actions."],
        ["Stats", "Lifetime spend, order count and units, average order value, and last order date."],
        ["Personal offers", "Internal deal tags for this customer, with optional branded email delivery."],
        ["Account", "Newsletter subscription, stated interests, and bio."],
        ["Products purchased", "Distinct products bought, with units and revenue each."],
        ["Order history", "Every order with number, status, date, item count, and total."],
      ],
    },
    {
      type: "heading",
      text: "Personal offers",
    },
    {
      type: "paragraph",
      text: "Offers are internal deal tags you attach to a customer — a way to recognise loyalty or win someone back. You can add an offer silently, or send it as a branded email in the same step, and re-send an existing offer later.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Add an offer",
          text: "Use the offer editor to create a tag — its label, kind, value, optional expiry, and a note.",
        },
        {
          title: "Email the customer (optional)",
          text: "Turn on 'Email the customer' to deliver the branded offer email as you save. On success the offer is stamped as notified.",
        },
        {
          title: "Re-send when needed",
          text: "Re-send the email for an existing offer at any time; the notified timestamp updates.",
        },
      ],
    },
    {
      type: "callout",
      variant: "info",
      text: "Offer emails go out through Resend. If Resend isn't configured, the send is skipped with a clear notice and the offer tag is still saved — so the workflow never silently fails.",
    },
    {
      type: "heading",
      text: "Roles & access",
    },
    {
      type: "paragraph",
      text: "Every account has an effective role — customer or admin. Promoting a customer to admin grants full access to the dashboard, including products, orders, and other customers; demoting removes it. Both actions require a confirmation.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Promote deliberately",
      text: "Admins can see and change everything in the dashboard. Only promote people who need that access, and demote as soon as they no longer do.",
    },
    {
      type: "heading",
      text: "Blocking an account",
    },
    {
      type: "paragraph",
      text: "Blocking is the lever for abuse or fraud. A blocked customer is signed out and refused at sign-in until unblocked — but their orders and history are kept, so nothing is lost and the block is fully reversible.",
    },
    {
      type: "callout",
      variant: "tip",
      text: "Blocking is reversible and non-destructive. If you're unsure, block first to stop activity — you can always unblock, and the customer's data stays intact either way.",
    },
    {
      type: "callout",
      variant: "info",
      text: "Customer records currently come from the app's local demo layer. After the server-side migration they are backed by the database and Better Auth sessions; this screen and its controls work identically.",
    },
  ],
}
