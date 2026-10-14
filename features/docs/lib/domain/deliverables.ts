/**
 * The ten deliverable rows: what a client receives at each tier.
 *
 * Split out of `tiers.ts` because the content is the bulk and the structure is
 * the contract - the architecture ratchet caught the combined module crossing
 * 300 lines, which was a fair reading of it doing two jobs.
 *
 * Pure data. The gated doc renders it; `missingTierValues` guards it.
 */

import type { DeliverableRow } from "./tiers"

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
