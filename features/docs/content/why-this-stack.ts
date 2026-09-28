import type { Doc } from "../schema"

export const whyThisStack: Doc = {
  slug: "why-this-technology-stack",
  title: "Why This Technology Stack",
  category: "Technology Strategy",
  audience: "cto",
  access: "public",
  summary:
    "The technology-strategy rationale a CTO needs: why Next.js 16, Neon Postgres, Better Auth, and Stripe — and why server-first. Each choice tied to a business outcome, not a trend.",
  readingMinutes: 8,
  order: 1,
  updatedAt: "2026-09-28",
  tags: ["stack", "strategy", "next.js", "neon", "stripe", "architecture", "cto"],
  body: [
    {
      type: "paragraph",
      text: "A stack is a set of bets. This one is deliberately conservative where it should be — proven, managed services for the hard problems — and modern where it pays off, in the rendering model. Here is the reasoning behind each choice, framed as the outcome it buys rather than the technology it is.",
    },
    {
      type: "table",
      title: "The choices and what they buy",
      headers: ["Layer", "Choice", "Why it wins the business"],
      rows: [
        ["Framework", "Next.js 16 (App Router)", "Server-first rendering: fast pages, strong SEO, less client JS to break"],
        ["Database", "Neon Postgres", "Serverless Postgres that scales to zero and back — you pay for use, not idle"],
        ["Auth", "Better Auth", "Real sessions and hashed passwords as a managed concern, not hand-rolled risk"],
        ["Payments", "Stripe", "PCI burden stays with Stripe; cards never touch our servers"],
        ["Content", "CMS seam + mappers", "Editors publish without a deploy; the CMS is swappable, not load-bearing"],
      ],
    },
    {
      type: "heading",
      text: "Why server-first is the keystone",
    },
    {
      type: "paragraph",
      text: "The single most consequential decision is rendering on the server by default. It is not a fashion — it is the lever that moves three business metrics at once: pages arrive fast (conversion), search engines see complete HTML (organic reach), and there is far less client-side JavaScript to ship, bloat, and break (reliability and maintenance cost).",
    },
    {
      type: "list",
      items: [
        "Conversion: less time-to-first-content directly reduces bounce on mobile, where most traffic lives.",
        "Reach: fully-rendered HTML is the friendliest possible input for SEO and social unfurls.",
        "Cost: shipping less JavaScript means fewer hydration bugs and a smaller surface to maintain over time.",
      ],
    },
    {
      type: "heading",
      text: "Why managed services for the hard parts",
    },
    {
      type: "paragraph",
      text: "Auth, payments, and the database are solved problems with expensive failure modes. Owning that code is pure downside risk — a security incident or a compliance gap costs far more than a subscription. Delegating them to Better Auth, Stripe, and Neon converts undifferentiated risk into a predictable line item and frees the team to build the parts customers actually see.",
    },
    {
      type: "heading",
      text: "Why the CMS is a seam, not a dependency",
    },
    {
      type: "paragraph",
      text: "Content is decoupled behind a typed seam with mappers, so the authoring tool is an implementation detail. Today it is a local corpus; tomorrow it is Strapi; if the right tool changes again, that is a mapper swap, not a rebuild. This is how the stack avoids the lock-in that eventually forces a replatform.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The strategy in one sentence",
      text: "Rent the risky commodities, own the rendering model and the content seam, and keep every layer replaceable — so the platform can evolve for years without a rewrite.",
    },
  ],
}
