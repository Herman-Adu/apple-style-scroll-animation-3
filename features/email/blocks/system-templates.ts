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
        text: "Write your campaign message here. Add sections from the block palette — headings, images, buttons, and more.",
        align: "left",
      },
      { id: bid("btn"), type: "button", label: "Explore the collection", href: "{{shop_url}}", align: "left" },
    ],
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
