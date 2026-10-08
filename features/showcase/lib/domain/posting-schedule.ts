/**
 * The month itself: which asset goes out when, what it says, and where it points.
 *
 * Kept apart from `posting-calendar.ts` so the rules and the derivations stay
 * readable next to each other, and so editing a month of copy never touches them.
 */

import {
  POSTING_DAYS,
  type PostingSlot,
  channelsForWeek,
} from "./posting-calendar"

/**
 * The month. Channel is derived from the weekly rotation, so only the asset, the
 * copy and the link are decided here.
 */
const SCHEDULE: Omit<PostingSlot, "channel">[] = [
  {
    week: 1,
    day: "tue",
    asset: { kind: "video", group: "buyer", format: "4x5" },
    hook: "A commerce store end to end in one take: storefront, checkout, back in stock, campaigns, discounts, orders.",
    docSlug: "roi-and-total-cost-of-ownership",
  },
  {
    week: 1,
    day: "wed",
    asset: { kind: "carousel", group: "email-case-study" },
    hook: "Email built into the store, not bolted on: a block builder, versioned saves, locked brand blocks.",
    docSlug: "case-study-email-platform",
  },
  {
    week: 1,
    day: "thu",
    asset: { kind: "video", group: "journey", format: "4x5" },
    hook: "One take from the scroll story through sign-in and into the admin. No cuts.",
    docSlug: "system-architecture-overview",
  },
  {
    week: 1,
    day: "fri",
    asset: { kind: "carousel", group: "buyer" },
    support: { kind: "social", id: "infographic-buyer-cost-table" },
    hook: "What it costs to run, and what you stop renting.",
    docSlug: "build-vs-buy-the-decision",
  },
  {
    week: 2,
    day: "tue",
    asset: { kind: "video", group: "engineer", format: "9x16" },
    hook: "The engineering proof, then a checkout: test counts, coverage and the architecture checks.",
    docSlug: "engineering-quality",
  },
  {
    week: 2,
    day: "wed",
    asset: { kind: "carousel", group: "security" },
    support: { kind: "social", id: "security-cover" },
    hook: "One permission check is a single point of failure, so there are three: the proxy, every server action, the UI.",
    docSlug: "security-and-compliance-posture",
  },
  {
    week: 2,
    day: "thu",
    asset: { kind: "video", group: "restock", format: "4x5" },
    hook: "Sold out, a shopper joins the waiting list, the admin restocks in one click, and the email goes out.",
    docSlug: "back-in-stock-alerts",
  },
  {
    week: 2,
    day: "fri",
    asset: { kind: "carousel", group: "engineer" },
    hook: "Architecture, three real flows, the test pyramid and the coverage ratchet.",
    docSlug: "architecture-in-diagrams",
  },
  {
    week: 3,
    day: "tue",
    asset: { kind: "video", group: "recruiter", format: "4x5" },
    hook: "The storefront, then the proof behind it.",
    docSlug: "why-this-technology-stack",
  },
  {
    week: 3,
    day: "wed",
    asset: { kind: "carousel", group: "how-it-was-built" },
    support: { kind: "social", id: "build-cover" },
    hook: "Test first, one sprint per pull request, green before merge. Every sprint, no exceptions.",
    docSlug: "contributing-and-workflow",
  },
  {
    week: 3,
    day: "thu",
    asset: { kind: "video", group: "sitetour", format: "4x5" },
    hook: "The whole site in one take: the scroll story, about, the journal, then contact.",
    docSlug: "showcase-launch-assets",
  },
  {
    week: 3,
    day: "fri",
    asset: { kind: "carousel", group: "recruiter" },
    hook: "What was built, what judgement went into it, and the proof it holds up.",
    docSlug: "whats-new",
  },
  {
    week: 4,
    day: "tue",
    asset: { kind: "video", group: "storefront", format: "landscape" },
    hook: "A muted half-minute of the storefront: the scroll story, a product, the cart.",
    docSlug: "managing-the-product-catalog",
  },
  {
    week: 4,
    day: "wed",
    asset: { kind: "carousel", group: "checkout-sequence" },
    support: { kind: "social", id: "sequence-checkout-cover" },
    hook: "Checkout, one step per swipe: pay, the total re-checked on the server, charged once, the webhook verified, the order saved, the email sent.",
    docSlug: "commerce-stripe-payments-and-webhooks",
  },
  {
    week: 4,
    day: "thu",
    asset: { kind: "video", group: "enquiry", format: "9x16" },
    hook: "A multi-step enquiry form whose fields change with the topic. The take stops on review and never presses send.",
    docSlug: "server-first-rendering-playbook",
  },
  {
    week: 4,
    day: "fri",
    asset: { kind: "carousel", group: "site-tour" },
    support: { kind: "social", id: "tour-storefront" },
    hook: "A map of everything included: storefront, admin, docs.",
    docSlug: "frequently-asked-questions",
  },
]

export const POSTING_CALENDAR: PostingSlot[] = SCHEDULE.map((entry) => ({
  ...entry,
  channel: channelsForWeek(entry.week)[POSTING_DAYS.indexOf(entry.day)],
}))
