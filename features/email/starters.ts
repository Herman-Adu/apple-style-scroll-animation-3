import type { EmailBlock } from "./blocks/types"
import { instantiateSection, type SectionBlock } from "./sections"

/**
 * Pure, client-safe starter layouts for the "New template" gallery. Blocks are
 * stored without ids; every template created from a starter gets fresh ids.
 */

export type StarterId =
  | "blank"
  | "newsletter"
  | "product-launch"
  | "sale"
  | "announcement"
  | "black-friday"
  | "bank-holiday"
  | "christmas"

export type StarterGroup = "essentials" | "seasonal"

export const STARTER_GROUPS: { id: StarterGroup; label: string }[] = [
  { id: "essentials", label: "Essentials" },
  { id: "seasonal", label: "Seasonal campaigns" },
]

export type Starter = {
  id: StarterId
  group: StarterGroup
  name: string
  blurb: string
  subject: string
  previewText: string
  description: string
  blocks: SectionBlock[]
}

export type NewTemplateInput = {
  name: string
  category: string
  subject: string
  previewText: string
  description: string
  blocks: EmailBlock[]
}

export const STARTERS: Starter[] = [
  {
    id: "blank",
    group: "essentials",
    name: "Blank",
    blurb: "A single text block. Build it your way from the palette.",
    subject: "",
    previewText: "",
    description: "",
    blocks: [{ type: "text", text: "Start writing here.", align: "left" }],
  },
  {
    id: "newsletter",
    group: "essentials",
    name: "Newsletter",
    blurb: "Hero, a short story, highlights and a link back to the shop.",
    subject: "What's new at {{brand_name}}",
    previewText: "This month in the lab: new tunings, stories and picks.",
    description: "Monthly newsletter.",
    blocks: [
      {
        type: "hero",
        eyebrow: "The newsletter",
        heading: "This month in *the lab*",
        subheading: "New tunings, behind-the-scenes stories and what our engineers are listening to.",
        imageUrl: "/email/hero-momo.png",
        align: "left",
      },
      { type: "text", text: "Hi {{customer_name}}, here's what we've been working on.", align: "left" },
      { type: "heading", text: "Highlights", align: "left" },
      {
        type: "list",
        title: "",
        items: ["A new reference tuning", "Inside the listening room", "Staff picks for the season"],
        ordered: false,
      },
      { type: "button", label: "Visit the shop", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    id: "product-launch",
    group: "essentials",
    name: "Product launch",
    blurb: "Big hero, key features and a clear call to action.",
    subject: "Introducing our newest reference instrument",
    previewText: "Engineered in the same lab, tuned to the same standard.",
    description: "Announce a new product.",
    blocks: [
      {
        type: "hero",
        eyebrow: "Just launched",
        heading: "Meet the *new standard*",
        subheading: "Link this hero to a product to show its live image and price.",
        imageUrl: "",
        align: "center",
      },
      { type: "heading", text: "Why it's different", align: "center" },
      {
        type: "list",
        title: "",
        items: ["Tuned by hand in our lab", "Studio-grade drivers", "Built to last a decade"],
        ordered: false,
      },
      { type: "button", label: "Shop now", href: "{{shop_url}}", align: "center" },
      { type: "divider" },
      { type: "productPicks", title: "Pairs well with", slugs: [] },
    ],
  },
  {
    id: "sale",
    group: "essentials",
    name: "Sale",
    blurb: "Offer front and centre, expiry callout and featured products.",
    subject: "{{offer_headline}} — for a limited time",
    previewText: "{{offer_expiry}}",
    description: "Promotional sale.",
    blocks: [
      {
        type: "hero",
        eyebrow: "{{offer_label}}",
        heading: "*{{offer_headline}}* across the range",
        subheading: "Reference-grade sound, for less. Don't wait too long.",
        imageUrl: "/email/hero-offer.png",
        align: "center",
      },
      { type: "callout", title: "Ends soon", body: "{{offer_expiry}}" },
      { type: "button", label: "Shop the sale", href: "{{shop_url}}", align: "center" },
      { type: "productPicks", title: "Featured in the sale", slugs: [] },
    ],
  },
  {
    id: "announcement",
    group: "essentials",
    name: "Announcement",
    blurb: "A short, plain update — store news, policy changes or events.",
    subject: "An update from {{brand_name}}",
    previewText: "A quick note from the team.",
    description: "General announcement.",
    blocks: [
      { type: "heading", text: "A quick update", align: "left" },
      {
        type: "text",
        text: "Hi {{customer_name}}, we wanted to let you know about a change at {{brand_name}}.",
        align: "left",
      },
      { type: "callout", title: "What this means for you", body: "Explain the change in a sentence or two." },
      { type: "button", label: "Learn more", href: "{{shop_url}}", align: "left" },
    ],
  },
  {
    id: "black-friday",
    group: "seasonal",
    name: "Black Friday",
    blurb: "Our biggest offer of the year — bold hero, countdown callout and deals grid.",
    subject: "Black Friday: {{offer_headline}}",
    previewText: "Our biggest offer of the year. {{offer_expiry}}",
    description: "Black Friday / Cyber Weekend campaign.",
    blocks: [
      {
        type: "hero",
        eyebrow: "Black Friday",
        heading: "Our biggest offer, *{{offer_headline}}*",
        subheading: "Once a year, reference-grade sound for less. Stock is limited.",
        imageUrl: "/email/hero-black-friday.png",
        align: "center",
      },
      { type: "callout", title: "Ends at midnight", body: "{{offer_expiry}}" },
      { type: "button", label: "Shop Black Friday", href: "{{shop_url}}", align: "center" },
      { type: "divider" },
      { type: "productPicks", title: "Best Black Friday deals", slugs: [] },
      {
        type: "text",
        text: "Free UK delivery on every order this weekend. Prices return to normal when the offer ends.",
        align: "center",
      },
    ],
  },
  {
    id: "bank-holiday",
    group: "seasonal",
    name: "Bank Holiday sale",
    blurb: "A relaxed long-weekend offer with a clear end date.",
    subject: "Long weekend, lower prices: {{offer_headline}}",
    previewText: "Our Bank Holiday sale is on. {{offer_expiry}}",
    description: "Bank Holiday weekend sale.",
    blocks: [
      {
        type: "hero",
        eyebrow: "Bank Holiday weekend",
        heading: "Make the long weekend *sound better*",
        subheading: "{{offer_headline}} across the range, this weekend only.",
        imageUrl: "/email/hero-bank-holiday.png",
        align: "left",
      },
      {
        type: "text",
        text: "Hi {{customer_name}}, an extra day off deserves a proper soundtrack. Here's what's on offer.",
        align: "left",
      },
      { type: "callout", title: "Weekend only", body: "{{offer_expiry}}" },
      { type: "button", label: "Shop the sale", href: "{{shop_url}}", align: "left" },
      { type: "productPicks", title: "Weekend favourites", slugs: [] },
    ],
  },
  {
    id: "christmas",
    group: "seasonal",
    name: "Christmas",
    blurb: "Gift guide, last order dates and festive picks.",
    subject: "The {{brand_name}} Christmas gift guide",
    previewText: "Gifts that sound as good as they look — order in time for Christmas.",
    description: "Christmas gift guide and last order dates.",
    blocks: [
      {
        type: "hero",
        eyebrow: "Christmas gift guide",
        heading: "Gifts that *sound* as good as they look",
        subheading: "Hand-tuned in our lab, wrapped and ready for the big day.",
        imageUrl: "/email/hero-christmas.png",
        align: "center",
      },
      { type: "productPicks", title: "Our gift picks", slugs: [] },
      {
        type: "list",
        title: "Last order dates",
        items: ["Standard delivery: add your date", "Express delivery: add your date", "Click & collect: add your date"],
        ordered: false,
      },
      { type: "callout", title: "Gifting made easy", body: "Free gift wrapping and extended returns until January." },
      { type: "button", label: "Shop gifts", href: "{{shop_url}}", align: "center" },
    ],
  },
]

export function getStarter(id: string): Starter | undefined {
  return STARTERS.find((s) => s.id === id)
}

export function buildFromStarter(id: string, makeId: () => string): NewTemplateInput | null {
  const starter = getStarter(id)
  if (!starter) return null
  return {
    name: starter.id === "blank" ? "Untitled template" : `${starter.name} template`,
    category: "marketing",
    subject: starter.subject,
    previewText: starter.previewText,
    description: starter.description,
    blocks: instantiateSection(starter.blocks, makeId),
  }
}

/** A copy of an existing template. System templates become marketing copies. */
export function buildFromExisting(
  source: Omit<NewTemplateInput, "previewText"> & { previewText?: string },
  makeId: () => string,
): NewTemplateInput {
  return {
    name: `${source.name} (copy)`,
    category: source.category === "system" ? "marketing" : source.category,
    subject: source.subject,
    previewText: source.previewText ?? "",
    description: source.description,
    blocks: source.blocks.map((b) => ({ ...structuredClone(b), id: makeId() }) as EmailBlock),
  }
}
