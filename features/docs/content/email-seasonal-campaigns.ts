import type { Doc } from "../schema"

export const emailSeasonalCampaigns: Doc = {
  slug: "email-seasonal-campaigns",
  title: "Seasonal Campaigns: From Starter to Send",
  category: "Email & Campaigns",
  audience: "content",
  access: "public",
  summary:
    "A worked example of building a Black Friday email from the starter gallery: pick a starter, personalise it with placeholders, reuse your brand header as a saved section, protect it with locked blocks, and recover safely with version history. Includes real renders of every seasonal starter.",
  readingMinutes: 8,
  order: 5,
  updatedAt: "2026-10-02",
  tags: ["email", "templates", "starters", "seasonal", "black friday", "christmas", "walkthrough"],
  body: [
    {
      type: "paragraph",
      text: "The template builder ships with a starter gallery so nobody begins from a blank page. This guide walks through one real campaign end to end, then shows what each starter looks like when it lands in a customer's inbox. Every image below is the actual rendered email, produced by the same renderer that sends to customers.",
    },
    { type: "heading", text: "The starter gallery" },
    {
      type: "table",
      title: "Starters available from New template",
      headers: ["Starter", "Group", "Best for"],
      rows: [
        ["Blank", "Essentials", "Building something unusual from scratch"],
        ["Newsletter", "Essentials", "Monthly updates and stories from the lab"],
        ["Product launch", "Essentials", "Announcing a new product or colourway"],
        ["Sale", "Essentials", "Any time-limited discount"],
        ["Announcement", "Essentials", "Store news, opening hours, policy changes"],
        ["Black Friday", "Seasonal campaigns", "The biggest offer of the year, with urgency built in"],
        ["Bank Holiday sale", "Seasonal campaigns", "Long-weekend promotions with a personal greeting"],
        ["Christmas", "Seasonal campaigns", "Gift guides with last order dates and gifting perks"],
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Start from an existing template",
      text: "The gallery also lists your own templates. Picking one makes an independent copy, which is the fastest way to reuse last year's Christmas email.",
    },
    { type: "heading", text: "Worked example: a Black Friday email" },
    {
      type: "steps",
      items: [
        {
          title: "Pick the starter",
          text: "Go to Admin, Email, Templates and choose New template. Under Seasonal campaigns pick Black Friday. You get a complete email with a hero image, an urgency callout, a button and a delivery note.",
        },
        {
          title: "Make the copy yours",
          text: "Edit the headline and subheading in each block. Use the placeholder picker rather than typing tokens by hand, so names like {{offer_headline}} and {{offer_expiry}} are always spelled correctly. The editor warns about unknown tokens and suggests the closest match.",
        },
        {
          title: "Reuse your brand header",
          text: "If you already saved a brand header as a section, open Saved sections in the palette and choose Insert. A fresh, separately editable copy is added, so changing it here never affects other templates.",
        },
        {
          title: "Protect what must not change",
          text: "Admins with lock permission can lock the header and footer. Locked blocks cannot be edited, moved or deleted, and new blocks are inserted between locked edges, so the brand frame stays intact. The server enforces this on save as well as the editor.",
        },
        {
          title: "Preview, then save",
          text: "The live preview refreshes as you type, using sample customer and order data. Undo and redo cover every change. If you navigate away with unsaved changes the editor asks before discarding them.",
        },
        {
          title: "Recover if something goes wrong",
          text: "Every save creates a version. Open Version history to restore any of the last 50 saves, or use Reset to original on a system template. The original version is always kept.",
        },
      ],
    },
    {
      type: "image",
      src: "/docs/showcase/email-black-friday.png",
      alt: "Rendered Black Friday email: dark hero with headphones and teal light streaks, the headline 'Our biggest offer, 15% off', an 'Ends at midnight' callout and a 'Shop Black Friday' button.",
      caption: "The Black Friday starter as a customer receives it. The offer and expiry come from placeholders.",
      width: 680,
      height: 1062,
    },
    { type: "heading", text: "The other seasonal starters" },
    {
      type: "image",
      src: "/docs/showcase/email-christmas.png",
      alt: "Rendered Christmas email: a wrapped gift with fairy lights, the headline 'Gifts that sound as good as they look', a last order dates list and a 'Shop gifts' button.",
      caption: "Christmas: fill in your last order dates before scheduling.",
      width: 680,
      height: 1148,
    },
    {
      type: "image",
      src: "/docs/showcase/email-bank-holiday.png",
      alt: "Rendered Bank Holiday email: headphones on a window sill overlooking a garden, the headline 'Make the long weekend sound better' and a personal greeting to the customer.",
      caption: "Bank Holiday sale: greets each customer by name using {{customer_name}}.",
      width: 680,
      height: 1052,
    },
    {
      type: "image",
      src: "/docs/showcase/email-newsletter.png",
      alt: "Rendered newsletter email with the headline 'This month in the lab', a highlights list and a 'Visit the shop' button.",
      caption: "Newsletter, from the Essentials group.",
      width: 680,
      height: 1056,
    },
    { type: "heading", text: "Transactional emails use the same builder" },
    {
      type: "paragraph",
      text: "Order confirmations, refunds, low stock alerts and order notifications are system templates built from the same blocks. The Product picks block pulls real products, prices and images from the live catalog, and the email updates when the catalog changes.",
    },
    {
      type: "image",
      src: "/docs/showcase/email-order-confirmation.png",
      alt: "Rendered order confirmation email showing two products with thumbnails and prices, a subtotal and total, and a 'What happens next' list.",
      caption: "Order confirmation, rendered with sample order MOMO-1024.",
      width: 680,
      height: 1330,
    },
    {
      type: "callout",
      variant: "note",
      title: "Placeholders available in every template",
      text: "Customer: {{customer_name}}, {{customer_email}}. Order: {{order_number}}, {{total}}, {{item_count}}, {{placed_at}}. Offer: {{offer_headline}}, {{offer_label}}, {{offer_expiry}}. Refund: {{amount}}, {{refund_eyebrow}}, {{refund_subheading}}, {{refund_note}}. Links: {{shop_url}}, {{order_url}}, {{admin_url}}. Brand: {{brand_name}}.",
    },
    { type: "heading", text: "Checklist before you schedule" },
    {
      type: "list",
      items: [
        "Every placeholder is recognised (no warnings in the editor).",
        "Dates in the copy match the offer, especially last order dates at Christmas.",
        "The brand header and footer are locked if other people will edit the template.",
        "You previewed on a narrow width as well as desktop.",
        "You saved, so the version you send is in Version history.",
      ],
    },
  ],
}
