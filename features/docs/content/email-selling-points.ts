import type { Doc } from "../schema"

export const emailSellingPoints: Doc = {
  slug: "email-system-selling-points",
  title: "Selling the Email System: Owned, Not Rented",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "The commercial case for the built-in email system: it replaces a rented ESP (Klaviyo, Mailchimp) with email that runs on your own domain and database, beside real order data. Covers the core pitch, five durable selling points, the total-cost story, and the roadmap that proves depth.",
  readingMinutes: 11,
  order: 3,
  updatedAt: "2026-09-26",
  tags: ["email", "positioning", "sales", "roi", "tco", "esp"],
  body: [
    {
      type: "paragraph",
      text: "Most stores rent their email. They pay a per-contact tax to Klaviyo or Mailchimp, hand their customer list to a third party, and bolt integrations on to make transactional data usable. This system is the opposite: email runs on your own Resend domain and your own Neon database, inside the same app as orders and Stripe. This guide turns that architecture into a sales story.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The one-line pitch",
      text: "Owned email, not rented: your domain, your database, your customer relationship — with no per-contact tax and no data handed to a third-party marketing cloud.",
    },
    {
      type: "heading",
      text: "Why this beats a rented ESP",
    },
    {
      type: "paragraph",
      text: "An ESP charges by list size, so your cost climbs precisely as your audience grows — you are penalised for success. Here, sending is flat infrastructure cost, and the audience lives in a database you control. The five points below are the ones to lead with.",
    },
    {
      type: "list",
      items: [
        "Block engine = a moat. Non-technical staff edit branded emails without touching code. The agency owns the code; the client's marketing person operates it. A cheaper template cannot replicate this.",
        "White-label / multi-tenant path. Central brand settings plus per-brand templates mean one deploy can run several brands or clients — sell one build, deploy it N times.",
        "Truly transactional personalisation. Because email sits beside real orders, offers, and Stripe data, messages use actual order lines, product images, and per-customer offers. Generic ESPs need paid integrations to get close.",
        "Team leverage. Presets, campaigns, and logged messaging let one or two operators run what usually needs a marketing team plus a tool subscription.",
        "Compliance and deliverability. Opt-in is respected, every send is logged, and replies route to a real inbox — a GDPR / CAN-SPAM-friendly, audit-ready posture.",
      ],
    },
    {
      type: "heading",
      text: "The cost story, drawn out",
    },
    {
      type: "paragraph",
      text: "The clearest way to make the point in a pitch is to plot cost against list size. Rented email scales with contacts; owned email stays flat. The crossover comes fast.",
    },
    {
      type: "chart",
      chartType: "line",
      title: "Figure 1 — Monthly email cost as the list grows",
      caption:
        "Illustrative: a per-contact ESP versus flat owned-infrastructure cost. The exact numbers vary by plan, but the shape does not — rented cost rises with every contact, owned cost does not.",
      unit: "$/mo",
      xKey: "contacts",
      data: [
        { contacts: "1k", esp: 30, owned: 20 },
        { contacts: "5k", esp: 90, owned: 20 },
        { contacts: "10k", esp: 150, owned: 22 },
        { contacts: "25k", esp: 350, owned: 25 },
        { contacts: "50k", esp: 600, owned: 30 },
      ],
      series: [
        { key: "esp", label: "Rented ESP (per-contact)", color: "var(--color-chart-4)" },
        { key: "owned", label: "Owned (flat infra)", color: "var(--color-chart-2)" },
      ],
    },
    {
      type: "table",
      title: "Rented vs owned, side by side",
      headers: ["Dimension", "Rented ESP", "This system"],
      rows: [
        ["Pricing", "Per-contact, rises with list", "Flat infrastructure cost"],
        ["Customer data", "Held by the vendor", "In your own database"],
        ["Transactional data", "Needs paid integrations", "Native — same app as orders"],
        ["Branding control", "Template constraints", "Full block-level control"],
        ["Lock-in", "Export friction, vendor risk", "You own the code and data"],
      ],
    },
    {
      type: "callout",
      variant: "note",
      title: "Frame it as TCO, not sticker price",
      text: "The build costs more up front than signing up for a SaaS. The counter is total cost of ownership: no per-contact tax, no integration fees, and no migration bill later. Over a year, owned wins on both cost and control.",
    },
    {
      type: "heading",
      text: "The roadmap is part of the pitch",
    },
    {
      type: "paragraph",
      text: "Depth sells. Showing where the system goes next signals that this is a platform, not a one-off. Present these as a considered phase 2, already designed for.",
    },
    {
      type: "list",
      items: [
        "Two-way inbox — receive and thread customer replies in-dashboard via inbound email + webhook.",
        "Open / click tracking and an analytics dashboard from delivery webhooks.",
        "Scheduled campaigns, send windows, and A/B subject testing.",
        "Template version history and rollback.",
        "Saved audience segments driven by real order history.",
        "Role-based access for larger teams.",
      ],
    },
    {
      type: "heading",
      text: "Objection handling",
    },
    {
      type: "steps",
      items: [
        {
          title: "\"Mailchimp is cheaper to start.\"",
          text: "To start, yes. But its price rises with your list while this stays flat — and you never hand over your customer data. Plot the two lines and the decision makes itself.",
        },
        {
          title: "\"Deliverability is why we pay an ESP.\"",
          text: "Sending runs on Resend with your authenticated domain, opt-in respected and every send logged. That is the same deliverability foundation, on infrastructure you control.",
        },
        {
          title: "\"Our marketing team needs to run this, not developers.\"",
          text: "That is exactly the block engine's job — branded emails, campaigns, and customer replies are all edited in the dashboard with no code.",
        },
        {
          title: "\"What if we outgrow it?\"",
          text: "The data is in standard Postgres and the roadmap already covers segments, tracking, and scheduling. You grow into the platform rather than migrating off it.",
        },
      ],
    },
    {
      type: "quote",
      text: "You are not renting a mailing list. You own the domain it sends from, the database it lives in, and the relationship it builds.",
    },
  ],
}
