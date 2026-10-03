import type { Doc } from "../lib/schema"

export const securityAndCompliancePosture: Doc = {
  slug: "security-and-compliance-posture",
  title: "Security & Compliance Posture",
  category: "Security & Trust",
  audience: "cto",
  access: "public",
  summary:
    "How the platform earns trust: server-verified auth, three independent permission layers (proxy, server actions, UI), payment data that never touches our servers, a full version history on every template, and defence-in-depth headers. Written for a buyer's security review.",
  readingMinutes: 10,
  order: 1,
  updatedAt: "2026-10-02",
  tags: ["security", "compliance", "trust", "pci", "auth", "cto", "posture", "permissions", "defence in depth"],
  body: [
    {
      type: "paragraph",
      text: "Most security reviews ask the same handful of questions. This page answers them at the level a decision-maker needs; the engineering detail is in the developer guides Authentication & Authorization and Email Platform Architecture. Two principles run through it: hand the riskiest work (passwords, payments) to specialist providers, and never let a single check be the only thing standing between a user and a privileged action.",
    },
    {
      type: "table",
      title: "Controls at a glance",
      headers: ["Concern", "How it is handled"],
      rows: [
        ["Authentication", "Better Auth on Neon: hashed passwords and server-issued session cookies, verified on every protected request"],
        ["Route protection", "A proxy refuses signed-out and non-admin requests to /admin before any page or action code runs"],
        ["Authorization", "Every admin server action calls requireAdmin() itself, so it holds even if the proxy is misconfigured"],
        ["Fine-grained permissions", "Locking brand blocks is limited to the owner and named admins, and re-checked on save, reset and restore"],
        ["Change history", "Every template save, reset and restore writes a version snapshot that can be restored"],
        ["Payment data", "Hosted by Stripe: card details never reach or persist on our servers"],
        ["Data isolation", "User-scoped queries filter by the session user id"],
        ["Sensitive content", "Owner-tier docs are stripped of their body on the server and never sent to a non-owner"],
        ["Unattended jobs", "The scheduled-send route requires a bearer secret and returns 501 if none is set"],
        ["Transport & headers", "HTTPS everywhere, plus defence-in-depth response headers"],
      ],
    },
    {
      type: "heading",
      text: "Three layers, one set of rules",
    },
    {
      type: "paragraph",
      text: "Permission rules live in one pure, unit-tested module (lib/auth/permissions.ts). Three separate layers apply those same rules. If one layer has a bug or a misconfiguration, the next one still refuses the request. The interface is the last line and exists only for clarity: it hides controls a user can't use, but nothing depends on it for security.",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — Defence in depth for an admin write",
      caption: "Each layer can refuse the request on its own. The rules come from one module, so the layers can't disagree.",
      diagram: [
        "flowchart LR",
        "  R[Request to /admin] --> P{Proxy: signed-in admin?}",
        "  P -- No, page visit --> S[Redirect to sign-in]",
        "  P -- No, form POST --> D1[401 or 403]",
        "  P -- Yes --> A{Server action: requireAdmin}",
        "  A -- No --> D2[AuthorizationError]",
        "  A -- Yes --> L{Touches a locked block?}",
        "  L -- No --> W[(Write to Neon + version snapshot)]",
        "  L -- Yes --> C{canLockBlocks?}",
        "  C -- No --> D3[Refused: block is locked]",
        "  C -- Yes --> W",
        "  RULES[[lib/auth/permissions.ts]] -.-> P",
        "  RULES -.-> A",
        "  RULES -.-> C",
      ].join("\n"),
    },
    {
      type: "heading",
      text: "Who can do what",
    },
    {
      type: "table",
      title: "Permissions matrix",
      headers: ["Capability", "Visitor", "Customer", "Admin", "Named locker", "Owner"],
      rows: [
        ["Browse the store, read public docs", "Yes", "Yes", "Yes", "Yes", "Yes"],
        ["Account area and order history", "No", "Yes", "Yes", "Yes", "Yes"],
        ["Admin dashboard (catalog, orders, settings)", "No", "No", "Yes", "Yes", "Yes"],
        ["Edit, duplicate, version and send email templates", "No", "No", "Yes", "Yes", "Yes"],
        ["Edit content inside a locked block", "No", "No", "No", "Yes (after unlocking)", "Yes (after unlocking)"],
        ["Lock or unlock blocks", "No", "No", "No", "Yes", "Yes"],
        ["Owner docs (positioning, pricing, sales)", "No", "No", "No", "No", "Yes"],
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "Configuration, not code changes",
      text: "Admins come from an email allowlist or a role set on the user record. Lock rights are granted and revoked only by the owner (herman@adudev.co.uk by default), are stored in the database, and every change writes an audit row. The server-only EMAIL_BLOCK_LOCKERS variable remains as a fallback seed. The owner can always lock, and the list never reaches the browser.",
    },
    {
      type: "heading",
      text: "Authentication is a real boundary",
    },
    {
      type: "paragraph",
      text: "Sessions and roles are verified on the server and never taken from the client. No browser storage flag grants admin. The proxy and the server actions read the session through the same helper, so a request is judged by the same rules wherever it lands.",
    },
    {
      type: "heading",
      text: "Mistakes are recoverable",
    },
    {
      type: "paragraph",
      text: "Security includes recovering from honest mistakes. Every template change creates a numbered version with a reason (create, save, reset, restore), and older versions can be restored in one click. System templates also keep their original so they can be reset. Restoring never erases history: it adds a new version on top.",
    },
    {
      type: "heading",
      text: "Payments: the PCI burden is not ours",
    },
    {
      type: "paragraph",
      text: "Checkout runs on Stripe, so cardholder data never touches the application, and that removes most of the PCI scope. The server recomputes order totals from its own prices rather than trusting the browser.",
    },
    {
      type: "heading",
      text: "Unattended work is locked down too",
    },
    {
      type: "paragraph",
      text: "Scheduled campaign sends run with no one signed in, so they go through a dedicated server-only function rather than through the admin actions. The route that triggers them refuses any call without the CRON_SECRET bearer token, and it does nothing until that secret is configured.",
    },
    {
      type: "heading",
      text: "Proven by tests, not promises",
    },
    {
      type: "list",
      items: [
        "The permission rules have their own unit tests: owner, named locker, ordinary admin, customer and signed-out cases.",
        "Integration tests call the real server actions with a mocked session and confirm a non-locker can't change or remove a locked block through save, reset or restore.",
        "The tests were written first and seen to fail before the code existed.",
        "The proxy was checked against the running app: signed-out visits to /admin redirect to sign-in.",
      ],
    },
    {
      type: "heading",
      text: "Defence in depth at the edge",
    },
    {
      type: "paragraph",
      text: "Standard response headers add protection on top of the application code: they block content-type sniffing, limit referrer data, enforce HTTPS, and restrict framing and browser features to what the app uses.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The posture in one line",
      text: "Passwords and payments are handled by specialists, every privileged action is checked by more than one independent layer using the same tested rules, and every content change can be undone. That is a security story that passes review.",
    },
  ],
}
