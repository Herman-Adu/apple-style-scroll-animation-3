import type { Doc } from "../lib/domain/schema"
import { DELIVERABLES } from "../lib/domain/deliverables"
import {
  CAPACITY,
  deliverableTableRows,
  PHASES,
  SETUP_DEPENDENCY,
  SUPPORT,
  TERM,
  TIERS,
  tierNames,
} from "../lib/domain/tiers"

/**
 * The gated master of the engagement ladder. Every table here is rendered from
 * `lib/domain/tiers.ts`, so the numbers a client is quoted and the data the
 * guard checks are the same object. The public counterpart is a subset of this
 * doc with no capacity model, no decision records and no prices.
 */
export const tierDeliverables: Doc = {
  slug: "tier-deliverables",
  title: "Tier Deliverables: Launch, Growth & Scale",
  category: "Positioning",
  audience: "owner",
  access: "owner",
  summary:
    "What a client actually receives at each tier - code access and escrow, whose name every account is in, who runs the infrastructure, training, support, and how they leave. The engagement phases, the capacity model behind the prices, and the decisions that set all of it.",
  readingMinutes: 9,
  order: 3,
  updatedAt: "2026-10-14",
  tags: [
    "tiers",
    "deliverables",
    "escrow",
    "support",
    "capacity",
    "retainer",
    "positioning",
  ],
  body: [
    {
      type: "paragraph",
      text: "The pricing guide answers what a build costs and what gets built. This one answers the question that follows it: what do I actually get, whose name is it in, who runs it, and how do I leave. It is the document to work from when a buyer says they have read the business case.",
    },
    {
      type: "callout",
      variant: "info",
      title: "The model in one sentence",
      text: "The client owns everything with consequences attached - their domain, their Stripe and Resend accounts, their data - and the platform runs on my managed infrastructure, which is what the monthly pays for. They are not buying a codebase; they are buying a system that runs, and a documented way out if they ever want one.",
    },
    {
      type: "heading",
      text: "The three tiers",
    },
    {
      type: "table",
      title: "The ladder",
      headers: ["Tier", "Who it's for"],
      rows: TIERS.map((tier) => [tier.name, tier.who]),
    },
    {
      type: "paragraph",
      text: "The tiers are defined by what I operate for the client, not by how much I build. That is deliberate: build volume is capped by the hours in a week, while operating a platform is systemised work that does not grow one-for-one with each client. It also means the ladder survives a second product - nothing in the deliverables below mentions commerce.",
    },
    {
      type: "heading",
      text: "What a client receives",
    },
    {
      type: "table",
      title: "Tier deliverables",
      headers: ["Deliverable", ...tierNames()],
      rows: deliverableTableRows(DELIVERABLES),
    },
    {
      type: "callout",
      variant: "warning",
      title: "Never say 'you own everything'",
      text: "It is an overclaim, and a technical buyer will catch it. Say exactly what is true: your domain, your Stripe, your Resend, your database account, your data, exportable at any time, with source escrow if I stop trading. I own and run the platform and the servers. The precise version survives scrutiny; the vague one costs the deal and the trust.",
    },
    {
      type: "heading",
      text: "The four engagement phases",
    },
    {
      type: "paragraph",
      text: "Price the phases separately. Setup is identical work every time, which makes it the most profitable hour in the engagement and the easiest to give away inside a single project price. Customisation is where the real time goes, so it is the phase that gets scoped rather than fixed.",
    },
    {
      type: "steps",
      items: PHASES.map((phase) => ({
        title: `${phase.title} - ${phase.basis}`,
        text: phase.text,
      })),
    },
    {
      type: "callout",
      variant: "warning",
      title: "The Setup dependency that is not yours",
      text: SETUP_DEPENDENCY,
    },
    {
      type: "heading",
      text: "Support, and what is never promised",
    },
    {
      type: "list",
      items: [
        `Hours: ${SUPPORT.hours}.`,
        SUPPORT.triage,
        `What is promised: ${SUPPORT.measures} A response target can be met honestly; a fix target promises an outcome nobody can size before looking at it.`,
        SUPPORT.incident,
        SUPPORT.noUptimeSla,
      ],
    },
    {
      type: "paragraph",
      text: "The same-day incident rule at every tier costs nothing in the overwhelming majority of months, and it is the difference between a support policy a buyer trusts and one they read as a way of not answering the phone. The no-uptime-guarantee line is the one to hold when a buyer's lawyer asks for a number.",
    },
    {
      type: "heading",
      text: "Capacity, and why it sets the price",
    },
    {
      type: "paragraph",
      text: `Eight concurrent Care clients, ${CAPACITY.clientDaysPerWeek} days a week on client work, ${CAPACITY.productDaysPerWeek} days ringfenced for building the next product. Care across a full book is roughly two days a month, which leaves about eleven days for Setup, Customisation, Build and Roadmap work - about one new engagement a month at a full book, and fewer if it is a Growth. That number is the argument for the prices, and the signal to stop selling.`,
    },
    {
      type: "table",
      title: "What one client costs against the cap",
      headers: ["Tier", "Slots used", "Why"],
      rows: TIERS.map((tier) => [
        tier.name,
        String(tier.slots),
        tier.slots > 1
          ? "A four-business-hour response needs headroom that cannot also be sold."
          : "One slot, on the standard response target.",
      ]),
    },
    {
      type: "callout",
      variant: "note",
      title: "The ninth client",
      text: CAPACITY.ninthClient,
    },
    {
      type: "heading",
      text: "Decisions",
    },
    {
      type: "paragraph",
      text: `Decision 1 - escrow and a licence, not an assignment. Context: the dashboard, template editor, presets and offers exist so a team with no engineers can run the platform themselves. That property makes the platform something to rent, not something to assign. Decision: the client never receives the repository as a deliverable; they get source escrow at every tier, released if I cease trading, breach the agreement or fail to deliver, and a priced perpetual licence is available at Scale for use in their own business only. Alternatives: full assignment at every tier, which is the custom-agency model; or no code rights at all, which fails the first serious due-diligence question. Trade-off: a buyer who insists on owning source will walk, and that is accepted - it is the engagement with the thinnest margin and the shortest life. In return the platform stays one asset that improves for every client at once, and for the next product.`,
    },
    {
      type: "paragraph",
      text: `Decision 2 - a monthly, not an optional maintenance contract. Context: I host and operate every deployment, so there is no version of the offer where the client runs it alone and pays nothing. Decision: a fixed Setup fee plus a monthly, on ${TERM.text.charAt(0).toLowerCase()}${TERM.text.slice(1)} Alternatives: a one-off build price with an optional care plan, which makes the recurring revenue a negotiation at the worst possible moment; or monthly-only with no setup fee, which finances every client's onboarding out of my own time. Trade-off: the monthly has to be defended once, up front, instead of never. In return the business has a floor that does not depend on winning the next deal, and the first year is predictable enough to plan product work around.`,
    },
    {
      type: "quote",
      text: "They own what it would hurt them to lose. I own what it would hurt me to give away.",
    },
  ],
}
