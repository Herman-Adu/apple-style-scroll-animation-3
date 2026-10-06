import { ADUDEV } from "./brand"
import { infographics } from "./infographics"

export const SOCIAL_FORMATS = {
  carousel: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
} as const

export type SocialFormat = keyof typeof SOCIAL_FORMATS

export type SocialAsset = {
  id: string
  format: SocialFormat
  role?: "cover" | "cta"
  eyebrow: string
  title: string
  body: string
  image?: { src: string; alt: string }
  points?: string[]
  diagram?: { source: string; alt: string }
  cta?: { ask: string; link: string; email: string }
  visual?: "layers"
}

export const CAROUSEL_ID = "carousel"
export const CAROUSEL_PDF = "/showcase/social/linkedin-carousel.pdf"
export const CASE_STUDY_LINK = "momo-audio.adudev.co.uk/docs/case-study-email-platform"

export function caseStudyUrl(): string {
  return `https://${CASE_STUDY_LINK}`
}

export const LAYER_STEPS = [
  { name: "Proxy", detail: "proxy.ts blocks the request at the edge" },
  { name: "Server action", detail: "requireAdmin re-checks the role" },
  { name: "UI", detail: "controls only render for allowed users" },
] as const

const LAYERS_DIAGRAM = `flowchart TD
  P["Proxy, proxy.ts<br/>checks the Better Auth session"] --> S["Server action<br/>requireAdmin"]
  S --> U["UI<br/>permission check"]
  U --> OK(["Action runs"])
  P -.-> D1["Not signed in:<br/>denied at the edge"]:::denied
  S -.-> D2["Wrong role:<br/>denied on the server"]:::denied
  U -.-> D3["Not allowed:<br/>control never renders"]:::denied`

const FLOW_DIAGRAM = `flowchart TD
  A["Checkout action<br/>total recomputed on the server"] --> B["Stripe payment<br/>idempotent, no double charge"]
  B --> C["Stripe webhook<br/>signature verified"]
  C --> D["Order saved as paid"]
  D --> E(["Resend sends the order email"])`

const shot = {
  christmas: {
    src: "/docs/showcase/email-christmas.png",
    alt: "Christmas campaign email with a festive hero, headline, products and a call-to-action button.",
  },
  newsletter: {
    src: "/docs/showcase/email-newsletter.png",
    alt: "Newsletter email showing catalog products with live prices.",
  },
  blackFriday: {
    src: "/docs/showcase/email-black-friday.png",
    alt: "Black Friday campaign email with a bold sale headline and featured products.",
  },
  bankHoliday: {
    src: "/docs/showcase/email-bank-holiday.png",
    alt: "Bank Holiday campaign email with a locked brand header and footer.",
  },
  orderConfirmation: {
    src: "/docs/showcase/email-order-confirmation.png",
    alt: "Order confirmation email listing the purchased items and totals.",
  },
}

export const socialAssets: SocialAsset[] = [
  {
    id: "carousel-cover",
    format: "carousel",
    role: "cover",
    eyebrow: "Case study",
    title: "Email built into the store, not bolted on.",
    body: "A block-based email platform inside a Next.js commerce site, shipped in small, test-first pull requests.",
    image: shot.christmas,
  },
  {
    id: "carousel-products",
    format: "carousel",
    eyebrow: "Real catalog data",
    title: "Live products and prices in every email.",
    body: "Product picks read straight from the store catalog, so nothing is copied by hand and nothing goes stale.",
    image: shot.newsletter,
  },
  {
    id: "carousel-starters",
    format: "carousel",
    eyebrow: "Seasonal starters",
    title: "Black Friday starts from a design, not a blank page.",
    body: "Black Friday, Bank Holiday and Christmas campaigns open as polished starters ready to edit.",
    image: shot.blackFriday,
  },
  {
    id: "carousel-locks",
    format: "carousel",
    eyebrow: "Brand control",
    title: "Brand blocks that can't drift.",
    body: "Headers and footers are saved, reused and locked. Only people the owner grants can unlock them, and every change is audited.",
    image: shot.bankHoliday,
  },
  {
    id: "carousel-history",
    format: "carousel",
    eyebrow: "Version history",
    title: "Every save is reversible.",
    body: "The last 50 versions are kept, the original is always kept, and Reset to original makes mistakes cheap.",
    image: shot.orderConfirmation,
  },
  {
    id: "carousel-flow",
    format: "carousel",
    eyebrow: "Checkout to inbox",
    title: "From payment to order email, verified at every step.",
    body: "Stripe confirms the payment, a signed webhook saves the order, and Resend sends the email.",
    diagram: {
      source: FLOW_DIAGRAM,
      alt: "Flow from the checkout action to a Stripe payment, a signature-verified Stripe webhook, the saved order and the Resend order email.",
    },
  },
  {
    id: "carousel-layers",
    format: "carousel",
    eyebrow: "Defence in depth",
    title: "Permissions enforced in three layers.",
    body: "One misconfigured layer is not a breach, because the other two still say no.",
    diagram: {
      source: LAYERS_DIAGRAM,
      alt: "A request passes three gates: the proxy, the server action and the UI. Each gate can deny it, and only a request that passes all three runs the action.",
    },
  },
  {
    id: "carousel-cta",
    format: "carousel",
    role: "cta",
    eyebrow: "Read the full story",
    title: "Build vs buy, with the receipts.",
    body: "Architecture, test growth, security posture and the business case are all in the public case study.",
    cta: {
      ask: "Need a build like this? Get in touch.",
      link: CASE_STUDY_LINK,
      email: ADUDEV.email,
    },
  },
  {
    id: "square-starters",
    format: "square",
    eyebrow: "Seasonal campaigns",
    title: "Christmas, ready before December.",
    body: "Seasonal starters with real products and live prices, rendered by the store's own email engine.",
    image: shot.christmas,
  },
  {
    id: "square-locks",
    format: "square",
    eyebrow: "Brand control",
    title: "Locked brand blocks, owner-granted.",
    body: "The owner decides who can unlock headers and footers. Every grant and revoke is audited.",
    image: shot.bankHoliday,
  },
  {
    id: "square-layers",
    format: "square",
    eyebrow: "Defence in depth",
    title: "Three layers say no.",
    body: "Proxy, server and UI each enforce permissions independently.",
    visual: "layers",
  },
]

export function getSocialAsset(id: string): SocialAsset | undefined {
  return socialAssets.find((a) => a.id === id)
}

export function carouselSlides(): SocialAsset[] {
  return socialAssets.filter((a) => a.format === "carousel")
}

export type ExportItem = {
  kind: "png" | "pdf"
  asset: string
  file: string
  width: number
  height: number
}

export function exportPlan(): ExportItem[] {
  return [
    ...[...socialAssets, ...infographics].map((a) => ({
      kind: "png" as const,
      asset: a.id,
      file: `/showcase/social/${a.id}.png`,
      ...SOCIAL_FORMATS[a.format],
    })),
    { kind: "pdf", asset: CAROUSEL_ID, file: CAROUSEL_PDF, ...SOCIAL_FORMATS.carousel },
  ]
}
