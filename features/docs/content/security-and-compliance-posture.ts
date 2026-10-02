import type { Doc } from "../schema"

export const securityAndCompliancePosture: Doc = {
  slug: "security-and-compliance-posture",
  title: "Security & Compliance Posture",
  category: "Security & Trust",
  audience: "cto",
  access: "public",
  summary:
    "The executive summary of how the platform handles trust: server-verified auth, payment data that never touches our servers, per-user data scoping, and defense-in-depth headers. Written for a buyer's security review.",
  readingMinutes: 8,
  order: 1,
  updatedAt: "2026-09-28",
  tags: ["security", "compliance", "trust", "pci", "auth", "cto", "posture"],
  body: [
    {
      type: "paragraph",
      text: "Most security reviews ask the same handful of questions. This is the platform's answer to them, at the altitude a decision-maker needs — the engineering detail lives in the developer Security & Auth guide. The theme throughout: sensitive burdens are delegated to providers whose entire business is getting them right.",
    },
    {
      type: "table",
      title: "Controls at a glance",
      headers: ["Concern", "How it is handled"],
      rows: [
        ["Authentication", "Better Auth on Neon — hashed passwords, server-issued session cookies, verified on every protected render"],
        ["Authorization", "Roles resolved server-side; admin writes re-check the role before touching the database"],
        ["Payment data", "Stripe-hosted — card details never reach or persist on our servers"],
        ["Data isolation", "Every user-scoped query filters by the session user id; no cross-tenant leakage"],
        ["Sensitive content", "Owner-tier docs are body-stripped server-side — never serialized to a non-owner"],
        ["Transport & headers", "HTTPS everywhere, plus defense-in-depth response headers"],
      ],
    },
    {
      type: "heading",
      text: "Authentication is a real boundary",
    },
    {
      type: "paragraph",
      text: "Sessions and roles are verified on the server, not trusted from the client. There is no localStorage flag that grants admin. A protected page checks a valid session before it renders, the admin area additionally requires a server-verified admin role, and every privileged write re-checks that role in the server action before it runs. The client is never the source of truth.",
    },
    {
      type: "heading",
      text: "Payments: the PCI burden is not ours",
    },
    {
      type: "paragraph",
      text: "Checkout is handled by Stripe, so cardholder data never touches the application. That is the single most important line in any commerce security review: the highest-risk data class is designed out of our systems entirely, and with it the bulk of PCI scope.",
    },
    {
      type: "heading",
      text: "Data stays in its lane",
    },
    {
      type: "list",
      items: [
        "User-scoped reads and writes filter by the authenticated user id, so one account cannot see another's data.",
        "Order and payment details are managed by Stripe and referenced, not copied into our store.",
        "Owner-only material is protected by two independent layers — nav filtering and server-side body-stripping — so it cannot be recovered from the network tab.",
      ],
    },
    {
      type: "heading",
      text: "Defense in depth at the edge",
    },
    {
      type: "paragraph",
      text: "Baseline response headers harden the deployed site beyond the application code: content-type sniffing is disabled, referrer exposure is constrained, HTTPS is enforced, and framing and feature access are locked down to what the app actually uses. These are cheap, standard, and layered on top of the auth boundary rather than in place of it.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The posture in one line",
      text: "The riskiest responsibilities — passwords and payments — are delegated to specialists, the app verifies trust on the server every time, and the remaining surface is hardened in depth. That is a security story that passes review.",
    },
  ],
}
