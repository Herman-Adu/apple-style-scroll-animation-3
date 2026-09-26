import type { Doc } from "../schema"

export const apiAndIntegrations: Doc = {
  slug: "api-and-integrations",
  title: "API & Integrations",
  category: "API & Integrations",
  audience: "developer",
  access: "admin",
  summary:
    "The store's HTTP surface and third-party integrations — the route handlers it exposes, the services it depends on (Neon, Better Auth, Stripe, Resend, Strapi), and how secrets and webhooks are secured.",
  readingMinutes: 7,
  order: 1,
  updatedAt: "2026-09-26",
  tags: ["developer", "api", "integrations", "webhooks", "stripe", "resend", "strapi", "neon"],
  body: [
    {
      type: "paragraph",
      text: "This store is server-first: most data flows through server components and server actions rather than a public REST API. The handful of HTTP endpoints that do exist serve specific jobs — authentication, CMS preview, and cache revalidation. This guide maps that surface and the external services behind it.",
    },
    {
      type: "heading",
      text: "Route handlers",
    },
    {
      type: "table",
      title: "Exposed endpoints",
      headers: ["Route", "Purpose", "Auth"],
      rows: [
        ["/api/auth/[...all]", "Better Auth's handler — sign-in, sign-up, session, and sign-out.", "Managed by Better Auth"],
        ["/api/preview", "Enters CMS draft preview mode for editors.", "Preview secret"],
        ["/api/exit-preview", "Leaves preview mode and returns to published content.", "Session"],
        ["/api/revalidate", "Receives CMS publish webhooks and refreshes affected cache tags.", "Shared secret"],
      ],
    },
    {
      type: "callout",
      variant: "note",
      text: "Product, order, and customer operations aren't a public API — they run as server actions invoked from the app, so there's no unauthenticated data endpoint to secure or version.",
    },
    {
      type: "heading",
      text: "Integrations",
    },
    {
      type: "table",
      title: "Third-party services",
      headers: ["Service", "Role", "Key variables"],
      rows: [
        ["Neon", "Serverless Postgres — the primary datastore.", "DATABASE_URL, DATABASE_URL_UNPOOLED"],
        ["Better Auth", "Authentication, sessions, and role management on Neon.", "BETTER_AUTH_SECRET"],
        ["Stripe", "Checkout and payment processing.", "STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
        ["Resend", "Transactional and campaign email delivery.", "RESEND_API_KEY, EMAIL_FROM"],
        ["Strapi", "Optional headless CMS for products, articles, and docs.", "CMS base URL + webhook secret"],
      ],
    },
    {
      type: "heading",
      text: "The revalidation webhook",
    },
    {
      type: "paragraph",
      text: "The most important integration endpoint is /api/revalidate. Strapi calls it on publish; the handler verifies a shared secret, maps the record's model to cache tags, and revalidates just those tags — so a single publish goes live in seconds without a redeploy or a full cache flush.",
    },
    {
      type: "code",
      language: "bash",
      code: "curl -X POST https://your-store.example/api/revalidate \\\n  -H \"Content-Type: application/json\" \\\n  -H \"x-webhook-secret: $REVALIDATE_SECRET\" \\\n  -d '{ \"model\": \"doc\", \"entry\": { \"slug\": \"api-and-integrations\" } }'",
    },
    {
      type: "paragraph",
      text: "Models map to tags through a single source of truth: each model resolves to a collection tag plus a per-entry tag (for example doc plus doc:api-and-integrations). An unmapped model returns a 'no tags mapped' response and revalidates nothing — which is the first thing to check when a publish doesn't appear.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Every webhook is authenticated",
      text: "The revalidate endpoint rejects any request without the correct shared secret. Never expose the secret client-side, and rotate it if it leaks.",
    },
    {
      type: "heading",
      text: "Secrets & configuration",
    },
    {
      type: "list",
      items: [
        "All credentials live in environment variables — never in the repo or client bundle.",
        "Only variables prefixed NEXT_PUBLIC_ reach the browser; everything else stays server-side.",
        "Server actions and route handlers read secrets at request time on the server, so keys never ship to the client.",
        "Rotating a key is a config change, not a code change — update the variable and redeploy.",
      ],
    },
    {
      type: "callout",
      variant: "tip",
      text: "When adding a new integration, follow the same pattern: put the secret in an environment variable, read it only on the server, and authenticate any inbound webhook with a shared secret before acting on it.",
    },
    {
      type: "heading",
      text: "Extending the surface",
    },
    {
      type: "paragraph",
      text: "If you later need a genuine public API — for a mobile app or a partner integration — add a versioned route under /api, authenticate it with the existing session or an API key, validate input, and scope every query to the requesting user. The security model documented in 'Authentication & Authorization' applies to new endpoints unchanged.",
    },
  ],
}
