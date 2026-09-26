import type { Doc } from "../schema"

export const showcaseAndPortfolio: Doc = {
  slug: "showcase-and-portfolio",
  title: "Showcasing This Build: Portfolio & Social",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "How to present this project as proof of senior engineering skill — on LinkedIn, Telegram, and a portfolio. What to highlight, ready-to-adapt post templates, the screenshots and links to attach, and where to drop the live URL once it is deployed.",
  readingMinutes: 9,
  order: 4,
  updatedAt: "2026-09-26",
  tags: ["portfolio", "showcase", "linkedin", "personal brand", "career"],
  body: [
    {
      type: "paragraph",
      text: "This build is a strong portfolio piece precisely because it is not a toy. It is a server-first commerce app with an owned email platform, real authentication and authorization, a database, and a documentation system for four different audiences. This guide helps you tell that story so the engineering reads as senior, not incidental.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "Lead with the decision, not the tool",
      text: "Anyone can list a stack. What signals seniority is explaining a trade-off: why server-first over a SPA, why owned email over an ESP, why a port/adapter seam in front of the CMS. Show the reasoning and the reader trusts the engineer.",
    },
    {
      type: "heading",
      text: "What to highlight",
    },
    {
      type: "paragraph",
      text: "Pick the angles that match your audience. Recruiters skim for scope and stack; engineers look for architecture and trade-offs; founders and clients care about outcomes. These are the load-bearing highlights of this build.",
    },
    {
      type: "table",
      title: "Highlights by audience",
      headers: ["Audience", "Lead with"],
      rows: [
        ["Recruiters / hiring managers", "Full-stack scope: commerce, auth, email, docs — shipped and documented"],
        ["Engineers", "Server-first rendering, port/adapter CMS seam, per-viewer access control"],
        ["Founders / clients", "Owned email replacing a rented ESP; lower cost, full data ownership"],
        ["Agencies", "White-label multi-tenant path — one build, many deploys"],
      ],
    },
    {
      type: "list",
      items: [
        "Architecture: a Next.js App Router app rendered server-first, with a thin data seam so the UI never talks to the CMS or database directly.",
        "Auth & authorization: Better Auth on Neon with server-verified roles — gated content is never even serialized to a browser that lacks the role.",
        "Owned email platform: block-based templates, campaigns, and customer messaging on your own domain and database.",
        "Documentation system: SSG + per-viewer gating, diagrams, and training walkthroughs written for users, admins, developers, and a CTO.",
      ],
    },
    {
      type: "heading",
      text: "Post templates you can adapt",
    },
    {
      type: "paragraph",
      text: "These are starting points, not scripts — rewrite them in your own voice. Replace the bracketed live URL once the site is deployed (see the section below).",
    },
    {
      type: "code",
      language: "text",
      title: "LinkedIn — the architecture angle",
      code: "I built a server-first commerce platform with its own email system — no rented ESP.\n\nA few decisions I am proud of:\n\n- Server-first rendering: pages are React Server Components by default; the browser only gets interactive islands. Fast pages, better SEO.\n- A port/adapter seam sits between the UI and the data source, so swapping the local corpus for a Strapi CMS is a config change, not a rewrite.\n- Email is owned, not rented: branded block-based templates, campaigns, and 1:1 customer messaging running on our own domain and Postgres — beside real order data.\n- Access control is enforced on the server: gated docs are never serialized to a browser without the role.\n\nWritten up end to end, with diagrams, for users, admins, and engineers.\n\nLive: [your-url-here]\n\n#nextjs #react #typescript #softwarearchitecture",
    },
    {
      type: "code",
      language: "text",
      title: "Telegram / short-form — the outcome angle",
      code: "New build shipped.\n\nA commerce app that owns its email instead of renting Klaviyo/Mailchimp: your domain, your database, campaigns and customer messaging built in. Server-first, so pages load fast. Fully documented with architecture diagrams and step-by-step training guides.\n\nLive demo: [your-url-here]",
    },
    {
      type: "callout",
      variant: "note",
      title: "Attach proof",
      text: "Posts with a visual get read. Attach the architecture diagram from the System Architecture Overview, a screenshot of the campaign composer with its live preview, and the docs hub itself. Screenshots of real UI beat any amount of prose.",
    },
    {
      type: "heading",
      text: "Turn the docs into portfolio assets",
    },
    {
      type: "list",
      items: [
        "The System Architecture Overview diagram is a ready-made hero image for a case study.",
        "The campaign walkthrough screenshots show real, polished product UI — use them as carousel slides.",
        "The auth & authorization doc is proof you think about security, not just features.",
        "This documentation library itself is the artifact: send the link and let the depth speak.",
      ],
    },
    {
      type: "heading",
      text: "Where the live URL goes",
    },
    {
      type: "paragraph",
      text: "Once the app is deployed to Vercel, you get a production URL. Put it everywhere the reader might want to click through, and update the bracketed placeholder in the post templates above.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Deploy",
          text: "Publish to Vercel. The production URL is your canonical demo link.",
        },
        {
          title: "Add it to your profiles",
          text: "LinkedIn featured section, the Projects section of your CV, your portfolio site, and your Telegram bio or pinned message.",
        },
        {
          title: "Link to the docs, not just the storefront",
          text: "The public docs hub is the part that proves engineering depth — send that link to technical readers, and the storefront to everyone else.",
        },
        {
          title: "Keep it current",
          text: "When you add a feature, update the relevant doc and post the diff. A living project reads as a living skill set.",
        },
      ],
    },
    {
      type: "callout",
      variant: "success",
      title: "The meta-point",
      text: "The fact that this project is documented this thoroughly is itself the strongest signal. Most engineers ship features; fewer document them for four audiences with diagrams and training guides. That gap is your differentiator — make it visible.",
    },
  ],
}
