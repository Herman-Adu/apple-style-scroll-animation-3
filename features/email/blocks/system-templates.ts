import type { EmailBlock } from "./types"

/**
 * Default block layouts for the built-in (system) templates. These are the
 * fallback used at send time and the seed rows inserted into the database so an
 * admin can customize them in the builder. Editing a system template in the DB
 * overrides these defaults; deleting the DB row falls back here.
 *
 * Tokens ({{customer_name}} etc.) are filled by the renderer's RenderContext.
 * Dynamic blocks (orderSummary) expand to live data at send time.
 */

export interface SystemTemplateDef {
  key: string
  name: string
  category: "transactional" | "marketing" | "system"
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
}

let idc = 0
const bid = (t: string) => `${t}-${++idc}`

export const SYSTEM_TEMPLATES: SystemTemplateDef[] = [
  {
    key: "order_confirmation",
    name: "Order confirmation",
    category: "transactional",
    subject: "Order confirmed — {{order_number}}",
    previewText: "Thank you. Your order is confirmed and being prepared.",
    description: "Sent automatically when a customer completes checkout.",
    blocks: [
      {
        id: bid("hero"),
        type: "hero",
        eyebrow: "Order confirmed",
        heading: "Thank you, {{customer_name}}",
        subheading: "Order {{order_number}} is *confirmed* and now being prepared with care.",
        imageUrl: "/email/hero-momo.png",
        align: "left",
      },
      {
        id: bid("text"),
        type: "text",
        text: "Every MOMO product is inspected and tuned by hand before it ships. Here is a summary of what is on its way to you.",
        align: "left",
      },
      { id: bid("order"), type: "orderSummary" },
      {
        id: bid("list"),
        type: "list",
        title: "What happens next",
        items: [
          "We prepare and quality-check your order within 1 business day.",
          "You will receive a shipping note with tracking as soon as it leaves the lab.",
          "Every order includes a 2-year warranty and 30-day home trial.",
        ],
        ordered: true,
      },
      { id: bid("btn"), type: "button", label: "View your order", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    key: "personal_offer",
    name: "Personal offer",
    category: "marketing",
    subject: "{{customer_name}}, here's {{offer_headline}} at MOMO",
    previewText: "A personal offer, applied automatically at checkout.",
    description: "Branded email sent when you grant a customer an offer.",
    blocks: [
      {
        id: bid("hero"),
        type: "hero",
        eyebrow: "A little something for you",
        heading: "{{offer_headline}}",
        subheading: "{{customer_name}}, we've added a *personal offer* to your MOMO account.",
        imageUrl: "/email/hero-offer.png",
        align: "left",
      },
      {
        id: bid("callout"),
        type: "callout",
        title: "{{offer_label}}",
        body: "Applied *automatically* at checkout — no code needed. {{offer_expiry}}",
      },
      { id: bid("btn"), type: "button", label: "Shop the collection", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    key: "shipping_update",
    name: "Shipping update",
    category: "transactional",
    subject: "Your MOMO order {{order_number}} has shipped",
    previewText: "Your order is on its way.",
    description: "Let a customer know their order is on the way (send from Messages).",
    blocks: [
      {
        id: bid("hero"),
        type: "hero",
        eyebrow: "On its way",
        heading: "Your order is *shipping*, {{customer_name}}",
        subheading: "Order {{order_number}} has left the lab.",
        imageUrl: "/email/hero-momo.png",
        align: "left",
      },
      {
        id: bid("text"),
        type: "text",
        text: "Add tracking details or delivery instructions here before you send.",
        align: "left",
      },
      { id: bid("btn"), type: "button", label: "Track your order", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    key: "welcome",
    name: "Welcome / newsletter",
    category: "marketing",
    subject: "Welcome to MOMO",
    previewText: "Reference-grade audio, engineered in one lab.",
    description: "A starting point for newsletters and campaigns.",
    blocks: [
      {
        id: bid("hero"),
        type: "hero",
        eyebrow: "The collection",
        heading: "Every product is a *reference instrument*",
        subheading: "Headphones, earbuds, and speakers — engineered in the same lab, tuned to the same standard.",
        imageUrl: "/email/hero-momo.png",
        align: "left",
      },
      {
        id: bid("text"),
        type: "text",
        text: "Write your campaign message here. Add sections from the block palette — or drop in a ready-made section preset to move faster.",
        align: "left",
      },
      {
        id: bid("heading"),
        type: "heading",
        text: "Why people choose MOMO",
        align: "left",
      },
      {
        id: bid("list"),
        type: "list",
        title: "",
        items: [
          "One lab, one tuning standard across every product.",
          "30-day home trial — listen before you commit.",
          "2-year warranty and lifetime support.",
        ],
        ordered: false,
      },
      {
        id: bid("callout"),
        type: "callout",
        title: "Members save first",
        body: "Subscribers hear about *new releases and offers* before anyone else.",
      },
      { id: bid("btn"), type: "button", label: "Explore the collection", href: "{{shop_url}}", align: "left" },
    ],
  },
]

/**
 * Ready-made section presets for the builder's "Insert a section" row. Each is a
 * small group of blocks an admin can drop in with one click, then edit — so a
 * complete, on-brand email comes together without wiring every block by hand.
 * Blocks are stored without ids; the editor assigns fresh ids on insert.
 */
export interface BlockPreset {
  key: string
  label: string
  blocks: Omit<EmailBlock, "id">[]
}

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    key: "feature_cta",
    label: "Feature + button",
    blocks: [
      { type: "heading", text: "A headline for this section", align: "left" },
      { type: "text", text: "Describe the product or news here. Use *asterisks* to accent key words.", align: "left" },
      { type: "button", label: "Shop now", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    key: "steps",
    label: "Numbered steps",
    blocks: [
      {
        type: "list",
        title: "What happens next",
        items: ["First step goes here.", "Then this happens.", "And finally this."],
        ordered: true,
      },
    ],
  },
  {
    key: "highlight",
    label: "Highlight note",
    blocks: [{ type: "callout", title: "Good to know", body: "A highlighted note that stands out from the body copy." }],
  },
  {
    key: "image_caption",
    label: "Image + caption",
    blocks: [
      { type: "image", src: "/email/hero-offer.png", alt: "", href: "" },
      { type: "text", text: "Add a short caption for the image above.", align: "center" },
    ],
  },
  {
    key: "signoff",
    label: "Sign-off",
    blocks: [
      { type: "divider" },
      { type: "text", text: "Questions? Just reply to this email — a real person reads every message.", align: "center" },
    ],
  },
]

/**
 * Default reply presets for the Messages composer. Seeded into the DB on first
 * use so staff start with reusable snippets instead of a blank inbox.
 */
export const SYSTEM_PRESETS: { name: string; category: string; subject: string; body: string }[] = [
  {
    name: "Delivery instructions",
    category: "shipping",
    subject: "About your MOMO delivery",
    body: "Hi {{customer_name}},\n\nThanks for your order. Could you confirm any delivery instructions (safe place, buzzer code, preferred day)? We'll pass them to the courier.\n\nBest,\nThe MOMO team",
  },
  {
    name: "Order update",
    category: "orders",
    subject: "An update on your MOMO order",
    body: "Hi {{customer_name}},\n\nA quick update on order {{order_number}}: [add the update here].\n\nReply to this email if you have any questions.\n\nBest,\nThe MOMO team",
  },
  {
    name: "Thank you",
    category: "general",
    subject: "Thank you from MOMO",
    body: "Hi {{customer_name}},\n\nThank you for choosing MOMO. We hope you're enjoying the sound. If anything isn't perfect, just reply — we're here to help.\n\nBest,\nThe MOMO team",
  },
  {
    name: "Back in stock",
    category: "general",
    subject: "It's back — your MOMO pick is in stock",
    body: "Hi {{customer_name}},\n\nGood news: the item you were waiting for is back in stock. Reply if you'd like us to hold one for you.\n\nBest,\nThe MOMO team",
  },
]

export function getSystemTemplate(key: string): SystemTemplateDef | undefined {
  return SYSTEM_TEMPLATES.find((t) => t.key === key)
}

/** Tokens surfaced in the builder UI as insertable chips. */
export const TEMPLATE_TOKENS: { token: string; label: string }[] = [
  { token: "{{customer_name}}", label: "Customer name" },
  { token: "{{brand_name}}", label: "Brand name" },
  { token: "{{order_number}}", label: "Order number" },
  { token: "{{shop_url}}", label: "Shop URL" },
  { token: "{{offer_headline}}", label: "Offer headline" },
  { token: "{{offer_label}}", label: "Offer label" },
  { token: "{{offer_expiry}}", label: "Offer expiry line" },
]
