import type { Doc } from "../schema"

export const emailSystemOverview: Doc = {
  slug: "email-system-overview",
  title: "The Email System: A Tour",
  category: "Email & Campaigns",
  audience: "content",
  access: "admin",
  summary:
    "One place to understand everything MOMO can send: automatic transactional emails, broadcast campaigns to your audience, and one-to-one customer messages. Start here, then follow the links into templates, the campaign walkthrough, and customer messaging.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["email", "resend", "campaigns", "transactional", "overview"],
  body: [
    {
      type: "paragraph",
      text: "MOMO sends three kinds of email, and they all share one branded look. This guide is the tour — what each kind is for, where it lives in the admin, and how to tell at a glance that delivery is healthy. If you only read one email doc, read this one; it links to everything else.",
    },
    {
      type: "heading",
      text: "The three kinds of email",
    },
    {
      type: "list",
      items: [
        "Transactional — sent automatically when something happens: an order is confirmed, an order ships, a customer signs up. You never press send; the store does it for you.",
        "Campaigns — a template broadcast to your audience (your opted-in subscribers or a specific list). This is your newsletter and your launch announcements.",
        "Messages — a one-to-one branded email you send to a single customer, optionally starting from a saved preset like \"Back in stock\" or \"Order update\".",
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "They all share one brand",
      text: "Colours, logo, footer, and hero image come from Email → Settings. Set your brand once and every transactional email, every campaign, and every customer message inherits it. You never restyle emails one by one.",
    },
    {
      type: "heading",
      text: "The overview screen",
    },
    {
      type: "paragraph",
      text: "Email → Overview is your home base. The banner at the top tells you whether delivery is live, the four counters summarise activity, and Recent activity is a running log of every send with its delivery status.",
    },
    {
      type: "image",
      src: "/docs/email/overview.png",
      alt: "The Email Overview screen showing a green 'Email delivery is live' banner, counters for emails sent, templates, campaigns and subscribers, and a recent activity log listing sent and failed emails with timestamps.",
      caption:
        "Figure 1 — Email → Overview. The green banner confirms Resend is connected and sending for real. Recent activity shows each send with a Sent or Failed status so problems surface immediately.",
      width: 1275,
      height: 918,
    },
    {
      type: "callout",
      variant: "success",
      title: "\"Email delivery is live\" means it is really sending",
      text: "When Resend is connected the banner is green and every send is a real email. If you ever see an amber \"test mode\" banner instead, emails are being simulated, not delivered — connect Resend in Settings before running a campaign.",
    },
    {
      type: "heading",
      text: "Reading Recent activity",
    },
    {
      type: "paragraph",
      text: "Each row is one email. The coloured tag is the delivery result and the small label under the subject tells you which kind of email it was — Transactional, Test, or a campaign. A Failed row is not a disaster; open it, check the recipient address, and resend. Most failures are a mistyped address or a customer whose inbox bounced.",
    },
    {
      type: "table",
      title: "What the status tags mean",
      headers: ["Tag", "Meaning", "What to do"],
      rows: [
        ["Sent", "Resend accepted the email and it is on its way.", "Nothing — this is the happy path."],
        ["Failed", "The send was rejected (bad address, bounce, or provider error).", "Open the row, verify the address, and try again."],
        ["Test", "Sent while previewing — a real email to your own address.", "Expected when you use \"Send test\"; ignore in production counts."],
      ],
    },
    {
      type: "heading",
      text: "Where to go next",
    },
    {
      type: "list",
      items: [
        "Building & Editing Templates — design the branded emails your campaigns and messages are built from.",
        "Create a Campaign: Step-by-Step — the full walkthrough, with screenshots, of composing and sending a broadcast.",
        "Messaging Customers One-to-One — reply to a single customer using saved presets.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "A good first move",
      text: "Before you send anything, open Email → Settings and set your brand name, accent colour, support address, and footer. Everything downstream inherits it, so five minutes here saves you re-editing every template later.",
    },
  ],
}
