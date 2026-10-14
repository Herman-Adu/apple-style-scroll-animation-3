/**
 * The engagement ladder: what a client receives at Launch, Growth and Scale.
 *
 * Typed data rather than prose, for the same reason the objection manifest in
 * `showroom.ts` is: the gated doc renders this module, so the table a buyer is
 * quoted from and the data a guard checks are the same object. A blank cell is
 * a promise nobody made, so `missingTierValues` is the guard's whole job.
 *
 * The model is **built-and-run**, not a code assignment: the client owns the
 * consequential things - their domain, their Stripe and Resend accounts, their
 * data - and the platform runs on the builder's managed infrastructure. Their
 * exit is contractual (export plus escrow) rather than a copy of the repository
 * on day one. See the Decisions section of the gated doc for why, and
 * `GLOSSARY.md` for why the bare word "handover" is not used here.
 *
 * Everything in this module is pure: no I/O, no framework, no rendering.
 */

export const TIER_IDS = ["launch", "growth", "scale"] as const

export type TierId = (typeof TIER_IDS)[number]

export type Tier = {
  id: TierId
  /** The name a buyer sees. Must match the pricing doc's packaging table. */
  name: string
  /** Who the tier is for, in one line. */
  who: string
  /**
   * What one client of this tier costs against the concurrent-client cap. A
   * four-business-hour response needs headroom that cannot also be sold, so a
   * Scale client takes two of the eight slots.
   */
  slots: number
}

export const TIERS: readonly Tier[] = [
  {
    id: "launch",
    name: "Launch",
    who: "A brand that needs to be trading, run by people who are not engineers",
    slots: 1,
  },
  {
    id: "growth",
    name: "Growth",
    who: "A team publishing and campaigning every week",
    slots: 1,
  },
  {
    id: "scale",
    name: "Scale",
    who: "Multi-market, integration-heavy, or an agency reselling the platform",
    slots: 2,
  },
]

export type DeliverableRow = {
  id: string
  /** The row label, as both docs render it. */
  label: string
  /** One value per tier. Identical values across tiers are deliberate. */
  values: Record<TierId, string>
}

/**
 * Ten rows, in the order a buyer asks about them: what do I get, whose name is
 * it in, who runs it, and how do I leave.
 */
export const DELIVERABLES: readonly DeliverableRow[] = [
  {
    id: "code-access",
    label: "Code access & escrow",
    values: {
      launch:
        "Source escrow from day one, released to you if I cease trading, breach the agreement or fail to deliver. No day-to-day repository access.",
      growth:
        "Source escrow from day one, on the same release triggers. No day-to-day repository access.",
      scale:
        "Escrow as standard, plus the option of a priced perpetual licence to the source for use in your own business - never for resale or redistribution.",
    },
  },
  {
    id: "vendor-accounts",
    label: "Vendor accounts",
    values: {
      launch:
        "Stripe, Resend and your managed database are opened in your name and billed to you. I hold delegated access you can revoke at any time.",
      growth:
        "Stripe, Resend and your managed database are opened in your name and billed to you. I hold delegated access you can revoke at any time.",
      scale:
        "Stripe, Resend and your managed database are opened in your name and billed to you. I hold delegated access you can revoke at any time.",
    },
  },
  {
    id: "hosting",
    label: "Hosting & infrastructure",
    values: {
      launch:
        "Runs on my managed infrastructure: one isolated deployment and one managed database for you alone, never shared with another client.",
      growth:
        "Isolated deployment and managed database, plus a staging environment so content and template changes can be reviewed before they are live.",
      scale:
        "Isolated deployment, managed database and staging, plus a dedicated managed server for your backend, sized to you and reviewed annually.",
    },
  },
  {
    id: "domain",
    label: "Domain & DNS",
    values: {
      launch:
        "Your domain, registered in your name. I configure DNS and the authenticated sending domain and document every record.",
      growth:
        "Your domain, registered in your name. DNS, the sending domain and any subdomains configured and documented.",
      scale:
        "Your domains, registered in your name, including per-market domains. DNS and sending domains configured and documented.",
    },
  },
  {
    id: "documentation",
    label: "Documentation",
    values: {
      launch:
        "The full documentation library, written for your team: running the store, the catalogue, orders, customers and campaigns.",
      growth:
        "The full library, plus written runbooks for the content types modelled for you.",
      scale:
        "The full library, plus runbooks for your content types and for each connected system.",
    },
  },
  {
    id: "training",
    label: "Training",
    values: {
      launch:
        "Recorded walkthroughs, plus one live session - recorded, and yours to keep.",
      growth: "Recorded walkthroughs, plus two live sessions, recorded.",
      scale:
        "Recorded walkthroughs, plus four live sessions, recorded, and one session for each new team member in the first year.",
    },
  },
  {
    id: "support",
    label: "Support window",
    values: {
      launch:
        "Monday to Friday, 09:00-17:00 UK. I respond within 3 business days.",
      growth:
        "Monday to Friday, 09:00-17:00 UK. I respond within 1 business day.",
      scale:
        "Monday to Friday, 09:00-17:00 UK. I respond within 4 business hours.",
    },
  },
  {
    id: "exit",
    label: "Data export & exit",
    values: {
      launch:
        "Your data on request, at any time: a standard PostgreSQL dump plus your media as files, within 5 business days. No proprietary format, no exit fee.",
      growth:
        "Your data on request, at any time: a standard PostgreSQL dump plus your media as files, within 5 business days. No proprietary format, no exit fee.",
      scale:
        "Your data on request, at any time: a standard PostgreSQL dump plus your media as files, within 5 business days. No proprietary format, no exit fee.",
    },
  },
  {
    id: "content-types",
    label: "Content types",
    values: {
      launch: "The platform's standard content types.",
      growth: "Standard types, plus up to three modelled for you.",
      scale: "Unlimited, scoped and sequenced through a Roadmap block.",
    },
  },
  {
    id: "retainer",
    label: "Retainer assumed",
    values: {
      launch:
        "Care plan. A 12-month initial term, then rolling monthly with 30 days' notice either side.",
      growth:
        "Care plan on the same term, plus a small Roadmap block for ongoing changes.",
      scale:
        "Care plan on the same term, plus a Roadmap block sized to your roadmap and reviewed quarterly.",
    },
  },
]

export type EngagementPhase = {
  title: string
  /** How it is priced. Fixed where the work is identical every time. */
  basis: "Fixed price" | "Scoped price" | "Fixed monthly"
  text: string
}

/**
 * Four phases, priced separately. The repeatable work - opening accounts,
 * wiring credentials, first deploy - is the most profitable hour in the
 * engagement and the easiest to give away inside a single project price.
 */
export const PHASES: readonly EngagementPhase[] = [
  {
    title: "Setup",
    basis: "Fixed price",
    text: "Your Stripe, Resend, database and hosting accounts opened in your name; OAuth credentials, auth secret and environment configured; your owner account seeded and my access demoted to delegated; domain and DNS; first deploy; and a smoke pass on a real checkout and a real send.",
  },
  {
    title: "Customisation",
    basis: "Scoped price",
    text: "Your brand, theme and fonts; your catalogue loaded; content types modelled to how you actually sell; email templates, campaign presets and offers set to your branding.",
  },
  {
    title: "Build",
    basis: "Scoped price",
    text: "Anything beyond the platform: integrations with systems you already run, bespoke flows, new customer-facing surfaces.",
  },
  {
    title: "Care",
    basis: "Fixed monthly",
    text: "Hosting and monitoring, security and dependency updates, platform maintenance, and the support window for your tier. New capability is Roadmap block work, so Care never quietly becomes free development.",
  },
]

/**
 * The dependency that turns a fixed-price Setup into an open-ended wait if it
 * is not named up front. Stated in the public doc as well as this one.
 */
export const SETUP_DEPENDENCY =
  "Stripe account verification, business identity checks and tax registration are yours and can take days that neither of us controls. Everything else in Setup is mine."

export const SUPPORT = {
  hours: "Monday to Friday, 09:00-17:00 UK",
  /**
   * A short triage window every weekday, including the two days ringfenced for
   * product work, is what makes a business-day response target honest when
   * client work only occupies three days a week.
   */
  triage:
    "A triage window every weekday morning, so a response target is never waiting on a day I am not in client work.",
  /** Response, never fix: a fix target promises an outcome nobody can size in advance. */
  measures: "Response times, not fix times.",
  incident:
    "An incident - the site down, payments failing, or email not sending - is acknowledged the same day at every tier, including Launch.",
  /**
   * Uptime belongs to the platforms underneath, so it is never resold here. The
   * one line in this module most likely to be deleted by a buyer's lawyer and
   * most important to keep.
   */
  noUptimeSla:
    "No uptime guarantee at any tier. Uptime is owned by the hosting, database, payment and email platforms underneath, and I will not resell a guarantee I do not control.",
} as const

export const TERM = {
  initialMonths: 12,
  noticeDays: 30,
  text: "A 12-month initial term, then rolling monthly with 30 days' notice either side.",
} as const

/**
 * The capacity model. Gated: it is the owner's constraint, not a client-facing
 * promise, and it is what justifies a price rather than a ninth client.
 */
export const CAPACITY = {
  concurrentCareClients: 8,
  clientDaysPerWeek: 3,
  productDaysPerWeek: 2,
  ninthClient:
    "The ninth client raises the price rather than filling the slot. Being fully booked at the wrong price is the failure mode a sole developer cannot recover from quickly.",
} as const

/** The tier names, in ladder order. */
export function tierNames(): string[] {
  return TIERS.map((tier) => tier.name)
}

/**
 * Deliverables with a missing or blank value at some tier, reported as
 * `row/tier` so the failure names the cell rather than the table.
 */
export function missingTierValues(
  rows: readonly DeliverableRow[] = DELIVERABLES,
): string[] {
  const missing: string[] = []

  for (const row of rows) {
    for (const id of TIER_IDS) {
      if (!row.values[id]?.trim()) missing.push(`${row.id}/${id}`)
    }
  }

  return missing
}

/** The matrix as a doc table: one row per deliverable, one column per tier. */
export function deliverableTableRows(
  rows: readonly DeliverableRow[] = DELIVERABLES,
): string[][] {
  return rows.map((row) => [
    row.label,
    ...TIER_IDS.map((id) => row.values[id]),
  ])
}
