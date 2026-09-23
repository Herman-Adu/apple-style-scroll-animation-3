import type { Doc } from "../schema"

export const authenticationAndAccess: Doc = {
  slug: "authentication-and-access-control",
  title: "Authentication & Access Control",
  category: "Security & Auth",
  audience: "developer",
  access: "admin",
  summary:
    "How sign-in, roles, route guards, and doc gating fit together today — and how the same access model moves server-side with Strapi without rewriting the app.",
  readingMinutes: 9,
  order: 1,
  updatedAt: "2026-09-23",
  tags: ["auth", "security", "route guard", "roles", "gating", "sessions"],
  body: [
    {
      type: "paragraph",
      text: "Access control runs through one context and a small set of guards, so every protected surface — the account area, the admin dashboard, and the gated docs — enforces the same rules the same way. This guide maps the pieces and the one behaviour that trips people up: what happens on sign-out from a guarded page.",
    },
    {
      type: "heading",
      text: "The moving parts",
    },
    {
      type: "table",
      headers: ["Piece", "Responsibility"],
      rows: [
        ["Auth context", "Holds the session and status (loading / authenticated / unauthenticated) and exposes sign-in/out."],
        ["Role derivation", "Admin is derived from an email allowlist, not a client-set flag."],
        ["Route guard", "Wraps protected pages; redirects to sign-in when unauthenticated."],
        ["Admin guard", "Route-group layout that additionally requires the admin role."],
        ["Doc gating", "canViewDoc decides whether a doc body is shipped to the browser at all."],
      ],
    },
    {
      type: "heading",
      text: "How a request flows",
    },
    {
      type: "mermaid",
      kind: "flow",
      title: "Figure 1 — Access decision",
      caption: "Every protected page runs the same decision before it renders.",
      diagram: [
        "flowchart TD",
        "  A[Visit protected page] --> B{Authenticated?}",
        "  B -- No --> C[Redirect to /sign-in]",
        "  B -- Yes --> D{Admin required?}",
        "  D -- No --> E[Render page]",
        "  D -- Yes --> F{Role is admin?}",
        "  F -- No --> G[Redirect to storefront]",
        "  F -- Yes --> E[Render page]",
      ].join("\n"),
    },
    {
      type: "heading",
      text: "Doc gating is a data decision, not a UI trick",
    },
    {
      type: "paragraph",
      text: "Gated docs are not merely hidden with CSS. For a non-admin viewer, the doc body is never serialised into the payload — only the summary is. That means admin guide content cannot be recovered from view-source or the network tab, because it was never sent.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Gating today is client-derived",
      text: "Pre-Strapi, the role is derived from local auth (the same demo model as the dashboard). It keeps honest users out of admin surfaces and keeps bodies off the wire, but it is not a server-enforced security boundary yet. Treat it as UX gating until the server-side move.",
    },
    {
      type: "heading",
      text: "Sign-out from a guarded page",
    },
    {
      type: "paragraph",
      text: "This is the subtle one. Signing out flips the session to unauthenticated. If you are standing on a guarded page (account or admin) when that happens, the route guard's effect fires and wants to send you to /sign-in — which is not where a signed-out shopper should land.",
    },
    {
      type: "steps",
      items: [
        { title: "The race", text: "A client-side router.replace('/') from the sign-out handler competes with the guard's router.replace('/sign-in'), and the guard tends to win." },
        { title: "The fix", text: "Sign-out uses a hard window.location.replace('/'), which unloads the guarded page immediately so the guard never gets to redirect." },
        { title: "The bonus", text: "A full navigation also clears client auth state cleanly, avoiding any stale session flicker." },
      ],
    },
    {
      type: "callout",
      variant: "info",
      title: "Rule of thumb",
      text: "Redirect after an auth state change with a real navigation, not a client push, when the current route is itself guarded by that same state. Otherwise the guard and your handler fight over the destination.",
    },
    {
      type: "heading",
      text: "What changes with Strapi",
    },
    {
      type: "paragraph",
      text: "The access model is designed so the move is additive, not a rewrite. The same access field on each doc and the same role concept drive real enforcement once auth is server-side — sessions become httpOnly cookies, the role is verified on the server, and gating stops being client-derived. The guards and the canViewDoc contract stay; only where the decision is trusted moves.",
    },
  ],
}
