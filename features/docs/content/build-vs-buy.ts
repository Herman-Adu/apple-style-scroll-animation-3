import type { Doc } from "../lib/schema"

export const buildVsBuy: Doc = {
  slug: "build-vs-buy-the-decision",
  title: "Build vs. Buy: The Decision",
  category: "Business Case",
  audience: "cto",
  access: "public",
  summary:
    "A decision framework for the classic question — off-the-shelf platform, cheap template, or a purpose-built stack. When each wins, and why a CMS-decoupled custom build is the pragmatic middle a growing brand actually needs.",
  readingMinutes: 8,
  order: 2,
  updatedAt: "2026-09-28",
  tags: ["build vs buy", "decision", "strategy", "cto", "platform", "lock-in"],
  body: [
    {
      type: "paragraph",
      text: "Every commerce team faces the same fork: rent a platform, buy a template, or build. The honest answer is that all three are right for someone — the skill is matching the choice to where the business actually is. This is the framework, without the vendor spin.",
    },
    {
      type: "heading",
      text: "The three options, plainly",
    },
    {
      type: "table",
      title: "What each option optimizes for",
      headers: ["Option", "Best when", "The catch"],
      rows: [
        ["All-in-one platform", "You want zero infra and standard needs", "Per-page tax, hard ceilings, real lock-in"],
        ["Cheap template", "You need something live this week, cheaply", "Client-heavy, brittle, rebuilt within ~18 months"],
        ["Purpose-built stack", "Content and speed are competitive levers", "Higher up-front build (offset by lower change cost)"],
      ],
    },
    {
      type: "heading",
      text: "The questions that decide it",
    },
    {
      type: "list",
      items: [
        "Does a non-engineer need to publish daily? If yes, you need a CMS seam, not a template.",
        "Is page speed a revenue lever for you (paid acquisition, SEO)? If yes, server-first beats a client-heavy builder.",
        "Will you add features over the next two years? If yes, a typed domain model pays for itself; a template fights you.",
        "Is lock-in a strategic risk? If yes, a swappable CMS and portable stack keep your negotiating position.",
      ],
    },
    {
      type: "quote",
      text: "Buy the commodity, build the differentiator. Nobody wins by hand-rolling auth — and nobody wins by renting the thing customers actually judge them on.",
    },
    {
      type: "heading",
      text: "Why this stack is the pragmatic middle",
    },
    {
      type: "paragraph",
      text: "This platform buys the commodities and builds the differentiator. Authentication, payments, and the database are proven managed services — you are not maintaining them. The content model, the rendering strategy, and the storefront experience are purpose-built, because those are the parts your customers judge you on. You get custom-build control without carrying custom-build maintenance for the plumbing.",
    },
    {
      type: "list",
      items: [
        "Bought: Better Auth sessions, Stripe payments, Neon Postgres — managed, secure, and boring in the best way.",
        "Built: the server-first storefront, the CMS seam, and the typed domain model — your competitive surface.",
        "Kept portable: the CMS is a seam, not a dependency, so switching authoring tools is a mapper change, not a rebuild.",
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "The decision in one line",
      text: "If content velocity and page speed matter to revenue and you expect to keep evolving, the buy-the-plumbing / build-the-experience stack beats both the template and the all-in-one — and it is the only one of the three that does not end in a replatform.",
    },
  ],
}
