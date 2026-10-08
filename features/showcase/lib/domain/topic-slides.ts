import type { SocialAsset } from "./social-assets"
import { tourStillPath } from "./asset-paths"

type Step = { name: string; title: string; body: string }

/** Who may do what, checked three times, then the gates and locks around every change. */
export const SECURITY_STEPS = [
  {
    name: "Proxy",
    title: "The proxy checks the session first.",
    body: "proxy.ts reads the Better Auth session before an admin page loads. Signed-out visitors never reach it.",
  },
  {
    name: "Server action",
    title: "Every admin action checks again.",
    body: "Each admin server action starts with requireAdmin, so a hand-crafted request is refused on the server.",
  },
  {
    name: "Screen",
    title: "The screen only shows what you may use.",
    body: "Buttons render from the same permission rules the server uses, so the UI never offers a forbidden action.",
  },
  {
    name: "Merge gates",
    title: "No change merges until every check passes.",
    body: "Types, lint, unit, integration, browser and accessibility tests run on every pull request. Red never merges.",
  },
  {
    name: "Locked blocks",
    title: "Brand blocks stay locked.",
    body: "The email header and footer cannot be edited by campaign authors, and every saved change keeps its history.",
  },
] as const satisfies readonly Step[]

/** The delivery loop every sprint followed. */
export const BUILD_STEPS = [
  {
    name: "Plan",
    title: "Every sprint starts from a written plan.",
    body: "Outcome, acceptance criteria and the tests to write are agreed before any code changes.",
  },
  {
    name: "Test first",
    title: "The failing test comes first.",
    body: "Each feature starts as a test that fails for the right reason, then just enough code to make it pass.",
  },
  {
    name: "One PR",
    title: "One sprint, one branch, one pull request.",
    body: "Small, reviewable changes, squash-merged so the history reads one sprint per commit.",
  },
  {
    name: "Green only",
    title: "Merges happen only on green.",
    body: "The app build, CI and the Vercel preview all have to pass. A failure is fixed in the same sprint.",
  },
  {
    name: "Ratchet",
    title: "Quality can only go up.",
    body: "Architecture numbers are measured against a committed baseline, so a regression fails the build.",
  },
] as const satisfies readonly Step[]

/** One recorded still per stop, taken from the buyer cut. */
export const TOUR_STOPS = [
  {
    id: "storefront",
    still: tourStillPath("storefront"),
    eyebrow: "Storefront",
    title: "Real product pages, ready to sell.",
    body: "Scroll-driven product stories with live prices from the catalogue.",
    alt: "Storefront hero for the Momo X headphones with the tagline Pure Sound, Zero Compromise on a dark background.",
  },
  {
    id: "checkout",
    still: tourStillPath("checkout"),
    eyebrow: "Checkout",
    title: "Discounts show instantly in the total.",
    body: "Stripe checkout with the order total always recomputed on the server.",
    alt: "Checkout page showing one Momo X in the order, a 20 percent launch discount and a total of 439 dollars.",
  },
  {
    id: "products",
    still: tourStillPath("products"),
    eyebrow: "Admin: products",
    title: "Stock and waiting lists at a glance.",
    body: "See who is waiting for each product and restock in one click.",
    alt: "Admin products table listing four products with price, stock level, status badges and how many shoppers are waiting.",
  },
  {
    id: "campaigns",
    still: tourStillPath("campaigns"),
    eyebrow: "Admin: campaigns",
    title: "Campaigns without a developer.",
    body: "Pick a template, write the subject, choose the audience and send.",
    alt: "Campaign editor with name, template, subject line and preview text fields, and an audience of specific email addresses.",
  },
  {
    id: "analytics",
    still: tourStillPath("analytics"),
    eyebrow: "Admin: analytics",
    title: "Revenue and orders in one view.",
    body: "Thirty days of revenue, best sellers and orders by status.",
    alt: "Analytics dashboard with a 30-day revenue line chart, a best sellers bar chart and orders grouped by status.",
  },
] as const

function stepCarousel(
  prefix: string,
  steps: readonly Step[],
  cover: { eyebrow: string; title: string; body: string },
): SocialAsset[] {
  const names = steps.map((s) => s.name)
  return [
    {
      id: `${prefix}-cover`,
      format: "carousel",
      role: "cover",
      pack: "topic",
      ...cover,
      progress: { steps: names, current: -1 },
    },
    ...steps.map((step, current): SocialAsset => ({
      id: `${prefix}-${current + 1}`,
      format: "carousel",
      pack: "topic",
      eyebrow: `Step ${current + 1} of ${steps.length}`,
      title: step.title,
      body: step.body,
      progress: { steps: names, current },
    })),
  ]
}

export const securitySlides = stepCarousel("security", SECURITY_STEPS, {
  eyebrow: "Security, layer by layer",
  title: "Five things stand between a click and your data.",
  body: "Three permission checks, strict merge gates and locked brand blocks. Swipe through each one.",
})

export const buildSlides = stepCarousel("build", BUILD_STEPS, {
  eyebrow: "How it was built",
  title: "Thirty-plus sprints, one loop.",
  body: "Plan, test first, one pull request, merge only on green, never let quality slip.",
})

export const tourSlides: SocialAsset[] = TOUR_STOPS.map((stop) => ({
  id: `tour-${stop.id}`,
  format: "carousel",
  pack: "topic",
  eyebrow: stop.eyebrow,
  title: stop.title,
  body: stop.body,
  image: { src: stop.still, alt: stop.alt },
}))

export const topicSlides: SocialAsset[] = [...securitySlides, ...buildSlides, ...tourSlides]
