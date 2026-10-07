export type Audience = "client" | "recruiter" | "both"

export interface ClipPlan {
  slug: string
  audience: Audience
  title: string
  spec: string
  routes: string[]
  captions: string[]
}

/** A seeded, never-expiring, uncapped percent code, so the checkout clip works on every take. */
export const CHECKOUT_DISCOUNT_CODE = "LAUNCH20"

/** The demo seed puts demo shoppers on this product's waiting list, so the restock clip emails nobody real. */
export const RESTOCK_PRODUCT_SLUG = "momo-beat"

export const CLIPS: ClipPlan[] = [
  {
    slug: "storefront",
    audience: "both",
    title: "Storefront tour",
    spec: "storefront.spec.ts",
    routes: ["/"],
    captions: [
      "A scroll-driven storefront, built on Next.js 16",
      "Real product pages, ready to sell",
      "Secure Stripe checkout, in test mode",
    ],
  },
  {
    slug: "checkout",
    audience: "both",
    title: "Checkout end to end",
    spec: "checkout.spec.ts",
    routes: ["/checkout"],
    captions: [
      "Add to cart in one tap",
      "Apply a discount code at checkout",
      "The saving shows instantly in the total",
      "Stripe handles the payment, in test mode",
    ],
  },
  {
    slug: "campaigns",
    audience: "client",
    title: "Email campaigns",
    spec: "campaigns.spec.ts",
    routes: ["/admin/email/campaigns"],
    captions: [
      "Email campaigns, built into the admin",
      "Open a campaign to see its audience and content",
      "Sent status and delivery stats at a glance",
    ],
  },
  {
    slug: "discounts",
    audience: "client",
    title: "Discounts, offers and message templates",
    spec: "discounts.spec.ts",
    routes: ["/admin/discounts", "/admin/email/messages"],
    captions: [
      "Create discount codes in seconds",
      "Percent off, free shipping, caps and expiry dates",
      "Saved message templates for faster replies",
    ],
  },
  {
    slug: "orders",
    audience: "client",
    title: "Orders, customers and analytics",
    spec: "orders.spec.ts",
    routes: ["/admin/orders", "/admin/customers", "/admin/analytics"],
    captions: [
      "Every order lands in the admin",
      "Customers, offers and order history in one place",
      "Analytics for revenue and orders",
    ],
  },
  {
    slug: "engineering",
    audience: "recruiter",
    title: "Engineering proof",
    spec: "engineering.spec.ts",
    routes: ["/docs", "/docs/engineering-quality"],
    captions: [
      "Documented like a product, not a prototype",
      "Architecture rules enforced on every pull request",
      "116 deep imports down to 0, 28 any down to 0",
    ],
  },
  {
    slug: "journey",
    audience: "both",
    title: "From scroll story to admin",
    spec: "journey.spec.ts",
    routes: ["/", "/sign-in", "/admin", "/admin/products", "/admin/theme", "/docs"],
    captions: [
      "A product story told by scrolling",
      "Sign in as the store owner",
      "A dashboard for sales, stock and demand",
      "Products, stock and waiting lists in one table",
      "Rebrand the store from the admin, no deploy",
      "Every decision written up in the docs",
    ],
  },
  {
    slug: "restock",
    audience: "client",
    title: "Back in stock, end to end",
    spec: "restock.spec.ts",
    routes: [`/products/${RESTOCK_PRODUCT_SLUG}`, "/admin/products", "/admin/email/templates"],
    captions: [
      "Sold out? Shoppers ask to hear when it is back",
      "One tap joins the waiting list",
      "The admin shows how many people are waiting",
      "Restock in one click",
      "Everyone waiting gets one email, sent once",
    ],
  },
]

const allRoutes = CLIPS.flatMap((clip) => clip.routes)
export const ADMIN_ROUTES = allRoutes.filter((route) => route.startsWith("/admin"))
export const PUBLIC_ROUTES = allRoutes.filter((route) => !route.startsWith("/admin"))

export function getClip(slug: string): ClipPlan {
  const clip = CLIPS.find((candidate) => candidate.slug === slug)
  if (!clip) throw new Error(`Unknown showcase clip: ${slug}`)
  return clip
}
