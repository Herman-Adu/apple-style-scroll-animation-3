import type { Doc } from "../lib/domain/schema"
import { DELIVERABLES } from "../lib/domain/deliverables"
import {
  deliverableTableRows,
  PHASES,
  phaseChecklist,
  SETUP_DEPENDENCY,
  SUPPORT,
  TERM,
  TIERS,
  tierNames,
} from "../lib/domain/tiers"

/**
 * The public half of the engagement ladder: the subset of the gated
 * `tier-deliverables` doc a buyer can read with nobody in the room.
 *
 * Every table renders the same typed data as the gated master, so the two
 * cannot promise different things. What stays behind the gate is the capacity
 * model, the decision records and every price. The four objections the ladder
 * provokes are answered here, and `lib/domain/showroom.ts` pins each answer to
 * the phrases that carry it - so an edit that removes the answer fails the
 * build rather than quietly leaving the gated promise unbacked.
 */
const exitRow = DELIVERABLES.find((row) => row.id === "exit")!

export const whatYouReceive: Doc = {
  slug: "what-you-receive",
  title: "What You Receive",
  category: "Business Case",
  audience: "cto",
  access: "public",
  summary:
    "What a client gets at Launch, Growth and Scale: whose name every account is in, who runs the infrastructure, what Setup covers, how support works, and exactly how you leave with your data if you ever want to.",
  readingMinutes: 6,
  order: 4,
  updatedAt: "2026-10-14",
  tags: [
    "tiers",
    "deliverables",
    "escrow",
    "onboarding",
    "support",
    "pricing",
    "cto",
  ],
  body: [
    {
      type: "paragraph",
      text: "Three questions decide whether a platform is worth buying, and none of them is about features: what do I actually get, whose name is it on, and how do I leave. This page answers all three, at every tier, before you have to ask. The case for the platform itself is in /docs/build-vs-buy-the-decision and /docs/roi-and-total-cost-of-ownership - this one is about the engagement around it.",
    },
    {
      type: "callout",
      variant: "info",
      title: "The model, stated plainly",
      text: "You own everything with consequences attached: your domain, your Stripe and Resend accounts, your database account, your data. The platform runs on managed infrastructure that I host and operate, which is what the monthly pays for. You are not buying a codebase to maintain - you are buying a system that runs, with a documented way out if you ever want one.",
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
      text: "The tiers are set by what gets operated for you, not by how much gets built. Nothing in the table below is specific to one kind of shop, which is deliberate: the same ladder has to hold for the next product as well as this one.",
    },
    {
      type: "heading",
      text: "What you receive at each tier",
    },
    {
      type: "table",
      title: "Tier deliverables",
      headers: ["Deliverable", ...tierNames()],
      rows: deliverableTableRows(DELIVERABLES),
    },
    {
      type: "heading",
      text: "What Setup covers",
    },
    {
      type: "paragraph",
      text: "Setup is the same work every time, so you get a checklist rather than an estimate. At the end of it you are trading on your own domain, on accounts that belong to you, with a real payment and a real email already tested.",
    },
    {
      type: "list",
      items: phaseChecklist(PHASES[0]),
    },
    {
      type: "callout",
      variant: "warning",
      title: "The part of Setup nobody controls",
      text: SETUP_DEPENDENCY,
    },
    {
      type: "heading",
      text: "How it is priced",
    },
    {
      type: "paragraph",
      text: "No number appears on this page, because two of the four phases are scoped to what you actually need and a figure here would be a guess at your business. The shape does not change, though, and it is worth knowing before a first call.",
    },
    {
      type: "table",
      title: "How the four phases are priced",
      headers: ["Phase", "How it is priced"],
      rows: PHASES.map((phase) => [phase.title, phase.basis]),
    },
    {
      type: "steps",
      items: PHASES.slice(1).map((phase) => ({
        title: `${phase.title} - ${phase.basis}`,
        text: phase.text,
      })),
    },
    {
      type: "paragraph",
      text: `There is no version of this offer without a monthly, because I am the one hosting and operating it. The term is ${TERM.text.charAt(0).toLowerCase()}${TERM.text.slice(1)}`,
    },
    {
      type: "heading",
      text: "Support, and what is never promised",
    },
    {
      type: "list",
      items: [
        `Hours: ${SUPPORT.hours}.`,
        `What is promised: ${SUPPORT.measures} A response target can be met honestly; a fix target promises an outcome nobody can size before looking at it.`,
        SUPPORT.incident,
        SUPPORT.noUptimeSla,
      ],
    },
    {
      type: "heading",
      text: "Your data, and how you leave",
    },
    {
      type: "paragraph",
      text: "Two things make an exit real rather than rhetorical: your data in a format any developer can read, and a copy of the source somewhere I cannot reach.",
    },
    {
      type: "list",
      items: [
        exitRow.values.launch,
        "Source escrow from day one, at every tier. The release triggers are written into the agreement: if I cease trading, breach it, or fail to deliver, the agent releases the source to you.",
        "A runbook for operating the platform, kept current, so the people running it day to day are your team rather than mine.",
      ],
    },
    {
      type: "paragraph",
      text: "If you would rather have another developer run it, nothing here is built to stop you. You keep your accounts, your domain, your data and the runbook; the escrow agreement covers the source on its release triggers; and at Scale a perpetual licence to the source, for use in your own business, can be priced up front rather than negotiated on the way out.",
    },
    {
      type: "heading",
      text: "Whose name every account is in",
    },
    {
      type: "paragraph",
      text: "Stripe, Resend, your managed database and your domain are opened in your name on day one and billed to you. It is the detail buyers are most surprised by and the one that matters most: your customers pay you directly, into your own Stripe account, and your sending reputation belongs to your domain rather than to mine. I hold delegated access so I can operate and support the platform, and you can revoke it at any time without asking me first.",
    },
    {
      type: "quote",
      text: "You own what it would hurt you to lose. I own what it would hurt me to give away.",
    },
  ],
}
