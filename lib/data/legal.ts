import { siteConfig } from "@/lib/data/site"

/** A single rendered block within a legal section. */
export type LegalBlock = string | { type: "list"; items: string[] }

/** One anchored section of a legal/policy page. */
export type LegalSection = {
  id: string
  heading: string
  blocks: LegalBlock[]
}

/** Full content model for a legal/policy page. */
export type LegalPageContent = {
  slug: string
  eyebrow: string
  title: string
  description: string
  /** Human-readable "last updated" label, e.g. "26 September 2026". */
  updated: string
  intro: string
  /** Optional advisory callout shown above the sections (used on Privacy/Terms). */
  disclaimer?: string
  sections: LegalSection[]
}

const supportEmail = siteConfig.email
const legalEmail = "legal@momoaudio.com"
const privacyEmail = "privacy@momoaudio.com"
const lastUpdated = "26 September 2026"

export const warrantyContent: LegalPageContent = {
  slug: "warranty",
  eyebrow: "Support",
  title: "Warranty",
  description:
    "Every Momo Audio product is covered by a 2-year limited warranty against defects in materials and workmanship.",
  updated: lastUpdated,
  intro:
    "We build for the long term — machined metal, serviceable parts, and repairs over replacement. Every Momo Audio product is protected by a 2-year limited warranty, backed by a team that would rather fix your headphones than sell you new ones.",
  sections: [
    {
      id: "coverage",
      heading: "What the warranty covers",
      blocks: [
        "For two years from the original date of purchase, Momo Audio warrants that your product will be free from defects in materials and workmanship under normal use. If a covered defect appears, we will repair the product, replace it, or replace the affected component at no charge to you.",
        {
          type: "list",
          items: [
            "Driver, amplifier, and internal electronics faults not caused by misuse.",
            "Structural failures of the headband, hinges, or chassis under normal wear.",
            "Battery cells that fall below 60% of rated capacity within the warranty period (earbuds and speakers).",
            "Manufacturing defects in cabling, connectors, and charging hardware supplied in the box.",
          ],
        },
      ],
    },
    {
      id: "exclusions",
      heading: "What it does not cover",
      blocks: [
        "The warranty does not extend to damage caused by accident, misuse, unauthorised modification, or ordinary cosmetic wear that does not affect performance.",
        {
          type: "list",
          items: [
            "Accidental damage, liquid ingress beyond the product's rated protection, or drops.",
            "Cosmetic wear such as scratches, scuffs, and fading of finishes over time.",
            "Ear tips, ear pads, and other consumable parts (available separately as spares).",
            "Products serviced or opened by anyone other than Momo Audio or an authorised partner.",
          ],
        },
      ],
    },
    {
      id: "claim",
      heading: "How to make a claim",
      blocks: [
        "Making a claim is straightforward and handled directly by our support team.",
        {
          type: "list",
          items: [
            `Email ${supportEmail} with your order number and a short description of the fault.`,
            "We will respond with a diagnosis and, where needed, a prepaid return label.",
            "Once we receive the product, we aim to repair or replace it within 10 working days.",
            "Repaired and replacement products are covered for the remainder of the original warranty, or 90 days, whichever is longer.",
          ],
        },
      ],
    },
    {
      id: "statutory",
      heading: "Your statutory rights",
      blocks: [
        "This limited warranty is offered in addition to, and does not affect, your statutory rights as a consumer under applicable law. Nothing in this warranty limits any right you have that cannot be excluded or limited by law.",
      ],
    },
  ],
}

export const shippingContent: LegalPageContent = {
  slug: "shipping",
  eyebrow: "Support",
  title: "Shipping",
  description:
    "How and when Momo Audio orders are dispatched, delivered, and tracked, with complimentary shipping on every order.",
  updated: lastUpdated,
  intro:
    "We ship worldwide from our fulfilment partners in Europe. Every order includes complimentary tracked shipping, careful protective packaging, and email updates from dispatch to doorstep.",
  sections: [
    {
      id: "cost",
      heading: "Cost and free shipping",
      blocks: [
        "Standard shipping is complimentary on every Momo Audio order, with no minimum spend. Where an express option is available at checkout, any additional cost is shown clearly before you pay.",
      ],
    },
    {
      id: "dispatch",
      heading: "Dispatch times",
      blocks: [
        "In-stock orders placed before 2pm (GMT) on a working day are dispatched the same day. Orders placed later, or over a weekend or public holiday, are dispatched the next working day.",
        "If an item is on backorder, we will tell you the expected dispatch date by email and give you the option to amend or cancel the order.",
      ],
    },
    {
      id: "delivery",
      heading: "Delivery estimates",
      blocks: [
        "Delivery windows are estimates from the point of dispatch and may vary with customs and local carrier conditions.",
        {
          type: "list",
          items: [
            "United Kingdom — 1 to 2 working days.",
            "Europe — 2 to 4 working days.",
            "North America — 3 to 6 working days.",
            "Rest of world — 5 to 10 working days.",
          ],
        },
      ],
    },
    {
      id: "tracking",
      heading: "Tracking your order",
      blocks: [
        "As soon as your order is dispatched, we send a shipping confirmation email with a tracking link. You can follow your parcel from our warehouse to your door, and we will email you if anything changes in transit.",
      ],
    },
    {
      id: "customs",
      heading: "Duties and customs",
      blocks: [
        "For deliveries outside the UK and EU, import duties or taxes may be charged by your local customs authority on arrival. These charges are set by your country and are the responsibility of the recipient. If you have any questions before ordering, contact us and we will help you estimate them.",
      ],
    },
    {
      id: "help",
      heading: "Problems with a delivery",
      blocks: [
        `If your order is delayed, arrives damaged, or does not arrive at all, email ${supportEmail} with your order number and we will make it right.`,
      ],
    },
  ],
}

export const returnsContent: LegalPageContent = {
  slug: "returns",
  eyebrow: "Support",
  title: "Returns",
  description:
    "Momo Audio offers a 30-day home trial. If a product is not right for you, return it for a full refund.",
  updated: lastUpdated,
  intro:
    "Sound is personal, so every Momo Audio product comes with a 30-day home trial. Listen in your own space, on your own music. If it is not right for you, send it back for a full refund — no debate.",
  sections: [
    {
      id: "trial",
      heading: "The 30-day home trial",
      blocks: [
        "You have 30 days from the date of delivery to decide whether a product is right for you. If you would like to return it within that window, we will refund the full purchase price to your original payment method.",
      ],
    },
    {
      id: "eligibility",
      heading: "Return conditions",
      blocks: [
        "To keep the process fair and fast, we ask that returned products meet a few simple conditions.",
        {
          type: "list",
          items: [
            "The return is requested within 30 days of delivery.",
            "The product is in good working order, with normal trial use accepted.",
            "Where possible, the original box and included accessories are returned with the product.",
            "Consumable parts such as ear tips are excluded for hygiene reasons unless faulty.",
          ],
        },
      ],
    },
    {
      id: "how",
      heading: "How to start a return",
      blocks: [
        "Returns are handled directly by our support team, and we cover the cost of the return label.",
        {
          type: "list",
          items: [
            `Email ${supportEmail} with your order number and let us know you would like to return.`,
            "We will send you a prepaid return label and simple packing instructions.",
            "Drop the parcel at your carrier point and keep the receipt until your refund is confirmed.",
          ],
        },
      ],
    },
    {
      id: "refunds",
      heading: "Refunds",
      blocks: [
        "Once we receive and inspect your return, we will confirm your refund by email and process it to your original payment method within 5 to 10 working days, depending on your bank or card provider.",
      ],
    },
    {
      id: "faulty",
      heading: "Faulty or damaged items",
      blocks: [
        "If a product arrives faulty or damaged, you do not need to wait for the trial process — contact us straight away and we will arrange a replacement or refund. Faults that appear later are covered by our 2-year warranty.",
      ],
    },
  ],
}

export const privacyContent: LegalPageContent = {
  slug: "privacy",
  eyebrow: "Legal",
  title: "Privacy Policy",
  description:
    "How Momo Audio collects, uses, and protects your personal data, and the rights you have over it.",
  updated: lastUpdated,
  disclaimer:
    "This policy is provided as a clear, good-faith summary of how the platform handles data. It is a template and should be reviewed with qualified legal counsel before you rely on it for a live commercial launch.",
  intro:
    "We take privacy seriously and collect only what we need to sell you great audio and support you well. This policy explains what we collect, why, who processes it on our behalf, and the rights you have over your data.",
  sections: [
    {
      id: "collect",
      heading: "Data we collect",
      blocks: [
        "We collect information you give us directly and a limited amount generated as you use the site.",
        {
          type: "list",
          items: [
            "Account data — your name, email address, and securely hashed password when you create an account.",
            "Order data — the products you buy, delivery address, and order history.",
            "Payment data — processed by our payment provider; we never see or store your full card details.",
            "Communications — messages you send us and your email preferences.",
            "Technical data — basic session and device information needed to keep you signed in and the site secure.",
          ],
        },
      ],
    },
    {
      id: "use",
      heading: "How we use your data",
      blocks: [
        {
          type: "list",
          items: [
            "To process orders, arrange delivery, and provide warranty and returns support.",
            "To manage your account and keep you securely signed in.",
            "To send transactional emails such as order confirmations and shipping updates.",
            "To send marketing and campaign emails only where you have opted in, with an unsubscribe link in every message.",
            "To improve the site, prevent fraud, and meet our legal obligations.",
          ],
        },
      ],
    },
    {
      id: "processors",
      heading: "Service providers",
      blocks: [
        "We share data only with the trusted providers that help us run the platform, each bound to process it solely on our instructions.",
        {
          type: "list",
          items: [
            "Neon — our managed database, which stores account and order records.",
            "Better Auth — our authentication layer, which manages sign-in sessions.",
            "Stripe — our payment processor, which handles card payments securely.",
            "Resend — our email provider, which delivers transactional and campaign email.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      heading: "Cookies and sessions",
      blocks: [
        "We use a small number of strictly necessary cookies to keep you signed in and to protect the site. These are essential to how the store works and do not track you across other websites. We do not sell your data or use it for third-party advertising.",
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      blocks: [
        "We keep account and order data for as long as your account is active and for as long afterwards as we need to meet legal, accounting, and warranty obligations. You can ask us to delete your account at any time.",
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      blocks: [
        "Depending on where you live, you have rights over your personal data, including the right to access, correct, delete, or export it, and to withdraw consent to marketing at any time.",
        `To exercise any of these rights, email ${privacyEmail} and we will respond within the timeframe required by law.`,
      ],
    },
    {
      id: "contact",
      heading: "Contact us",
      blocks: [
        `Questions about this policy or how we handle your data can be sent to ${privacyEmail}. Momo Audio operates from ${siteConfig.location}.`,
      ],
    },
  ],
}

export const termsContent: LegalPageContent = {
  slug: "terms",
  eyebrow: "Legal",
  title: "Terms of Service",
  description:
    "The terms that govern your use of the Momo Audio website and your purchases from us.",
  updated: lastUpdated,
  disclaimer:
    "These terms are provided as a professional template written in plain English. Review them with qualified legal counsel before relying on them for a live commercial launch.",
  intro:
    "These terms set out the agreement between you and Momo Audio when you use our website and buy our products. By using the site or placing an order, you agree to them.",
  sections: [
    {
      id: "use",
      heading: "Using our site",
      blocks: [
        "You may use the Momo Audio website for lawful, personal purposes. You agree not to misuse the site, attempt to disrupt it, access it in an unauthorised way, or use it in a manner that infringes the rights of others.",
      ],
    },
    {
      id: "accounts",
      heading: "Your account",
      blocks: [
        "If you create an account, you are responsible for keeping your login details secure and for activity that takes place under your account. Tell us straight away if you believe your account has been used without your permission.",
      ],
    },
    {
      id: "orders",
      heading: "Orders and pricing",
      blocks: [
        "All orders are subject to acceptance and availability. We take care to display prices and product information accurately, but errors can occur. If we discover an error in the price or description of something you have ordered, we will contact you before dispatch and give you the option to continue at the correct price or cancel.",
      ],
    },
    {
      id: "payment",
      heading: "Payment",
      blocks: [
        "Payment is taken securely through our payment provider at the time you place your order. Prices are shown in the currency displayed at checkout and include applicable taxes unless stated otherwise.",
      ],
    },
    {
      id: "returns",
      heading: "Warranty and returns",
      blocks: [
        "Our 30-day home trial and 2-year limited warranty are described in full on our Returns and Warranty pages, which form part of these terms. Nothing in these terms affects your statutory rights as a consumer.",
      ],
    },
    {
      id: "ip",
      heading: "Intellectual property",
      blocks: [
        "All content on this site — including text, product designs, imagery, logos, and software — is owned by or licensed to Momo Audio and is protected by intellectual property law. You may not reproduce or reuse it without our written permission.",
      ],
    },
    {
      id: "liability",
      heading: "Liability",
      blocks: [
        "We provide the site with reasonable care and skill, but we do not exclude or limit our liability where it would be unlawful to do so, including for death or personal injury caused by negligence or for fraud. Subject to that, we are not liable for losses that were not reasonably foreseeable.",
      ],
    },
    {
      id: "law",
      heading: "Governing law",
      blocks: [
        "These terms are governed by the laws of England and Wales, and any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales, save where mandatory local consumer law provides otherwise.",
      ],
    },
    {
      id: "contact",
      heading: "Contact us",
      blocks: [
        `Questions about these terms can be sent to ${legalEmail}. Momo Audio operates from ${siteConfig.location}.`,
      ],
    },
  ],
}

/** Every legal page keyed by slug, for routing and static generation. */
export const legalPages: Record<string, LegalPageContent> = {
  warranty: warrantyContent,
  shipping: shippingContent,
  returns: returnsContent,
  privacy: privacyContent,
  terms: termsContent,
}
