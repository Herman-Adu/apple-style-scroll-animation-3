import type { Doc } from "../schema"

export const socialAndRecruitmentMarketing: Doc = {
  slug: "social-and-recruitment-marketing",
  title: "Social & Recruitment Marketing Playbook",
  category: "Positioning",
  audience: "developer",
  access: "admin",
  summary:
    "The tactical companion to the Showcase guide: a ready-to-run content engine. A two-week launch calendar, a copy bank of post variants for LinkedIn, X, and Telegram tuned to each audience, and recruitment artifacts — CV line, STAR bullets, interview talking points, and a 60-second verbal pitch — so this build works as hard for your career as it does for the client.",
  readingMinutes: 12,
  order: 5,
  updatedAt: "2026-09-26",
  tags: ["marketing", "social", "linkedin", "recruitment", "personal brand", "career", "content"],
  body: [
    {
      type: "paragraph",
      text: "The Showcase guide covers how to frame the build. This guide gives you the raw material to actually post: a launch cadence, a bank of copy you can lift and edit, and a set of recruitment artifacts. The goal is to turn one project into weeks of credible, senior-signalling content across every audience — clients, engineers, founders, and recruiters.",
    },
    {
      type: "callout",
      variant: "tip",
      title: "One build, many posts",
      text: "Do not compress everything into a single launch post. Each decision in this project — server-first rendering, owned email, the CMS seam, per-viewer access control — is its own post. Spreading them out reads as depth and keeps you visible for weeks instead of one day.",
    },
    {
      type: "heading",
      text: "Know who is reading, and where",
    },
    {
      type: "paragraph",
      text: "Each platform skews toward a different reader with a different question in mind. Match the angle to the audience or the post lands flat.",
    },
    {
      type: "table",
      title: "Audience by platform",
      headers: ["Platform", "Primary reader", "What they want to see"],
      rows: [
        ["LinkedIn", "Recruiters, hiring managers, founders", "Scope, outcomes, and one clear technical decision explained well"],
        ["X / Twitter", "Engineers, indie builders", "Sharp technical takes, threads, screenshots, build-in-public energy"],
        ["Telegram", "Peers, community, warm leads", "Short, direct updates with a live link"],
        ["GitHub README", "Engineers, technical screeners", "Architecture, stack, run instructions, diagrams"],
        ["Portfolio / case study", "Recruiters and clients doing due diligence", "The full story: problem, decisions, trade-offs, result"],
      ],
    },
    {
      type: "heading",
      text: "A two-week launch calendar",
    },
    {
      type: "paragraph",
      text: "A staggered cadence beats a single announcement. Here is a workable rhythm — shift the days to suit your schedule, but keep the one-topic-per-post discipline.",
    },
    {
      type: "steps",
      items: [
        {
          title: "Day 1 — LinkedIn launch (outcome angle)",
          text: "Announce the build. Lead with what it does for a business (owns its email, server-first, fully documented) and drop the live URL. Attach the architecture diagram.",
        },
        {
          title: "Day 3 — X thread (architecture angle)",
          text: "A 4–6 tweet thread on the server-first decision and the port/adapter CMS seam. One screenshot per key point.",
        },
        {
          title: "Day 5 — Telegram (short update + link)",
          text: "Two lines and the live demo link for your immediate network. Ask for feedback to drive replies.",
        },
        {
          title: "Day 8 — LinkedIn (cost / TCO angle)",
          text: "The 'owned email, not rented' story with the cost comparison from the Email Selling Points doc. Founders and agencies engage with this one.",
        },
        {
          title: "Day 10 — X (build-in-public detail)",
          text: "One specific thing you are proud of: per-viewer doc gating, the block-based email renderer, or the instant Strapi revalidation webhook.",
        },
        {
          title: "Day 12 — LinkedIn (the docs as the artifact)",
          text: "Post the documentation library itself. 'I documented this for four audiences with diagrams and training guides.' Link the public docs hub.",
        },
      ],
    },
    {
      type: "heading",
      text: "Copy bank — adapt, do not copy verbatim",
    },
    {
      type: "paragraph",
      text: "These are drafts in different voices and angles. Rewrite in your own words, swap in the live URL, and keep only the claims that are true of your deployment.",
    },
    {
      type: "code",
      language: "text",
      title: "LinkedIn — cost / TCO angle",
      code: "Most e-commerce teams rent their email. Every new contact costs more on Klaviyo or Mailchimp — you are taxed for growing your own audience.\n\nSo I built the alternative into the platform itself:\n\n- Campaigns, transactional email, and 1:1 customer messaging on our own Resend domain and Postgres database.\n- Flat infrastructure cost instead of per-contact pricing.\n- Full ownership of the customer relationship and data.\n\nBecause email lives beside real order data, messages use actual order lines, product images, and per-customer offers — no paid integrations to bolt on.\n\nLower total cost of ownership, and you own the asset.\n\nLive: [your-url-here]\n\n#ecommerce #nextjs #startups",
    },
    {
      type: "code",
      language: "text",
      title: "X / Twitter — thread (architecture angle)",
      code: "1/ I built a server-first commerce platform with its own email system. A thread on the decisions that made it fast and maintainable.\n\n2/ Server-first: pages are React Server Components by default. The browser only downloads interactive islands, not the whole app. Fast first paint, clean SEO.\n\n3/ A port/adapter seam sits between the UI and the data source. The UI never talks to the CMS or DB directly — so swapping the local corpus for Strapi is a config change, not a rewrite.\n\n4/ Access control is enforced on the server. Gated content is never serialized to a browser that lacks the role. Not hidden with CSS — never sent.\n\n5/ Email is owned, not rented: block-based templates, campaigns, and customer messaging on our own domain + Postgres.\n\n6/ Documented end to end with diagrams for four audiences. Live: [your-url-here]",
    },
    {
      type: "code",
      language: "text",
      title: "LinkedIn — recruiter angle (open to work)",
      code: "I ship full-stack, and I document what I ship.\n\nMy latest build is a production-grade commerce platform:\n\n- Frontend + backend: Next.js App Router, server-first, TypeScript end to end.\n- Auth & authorization: Better Auth on Neon Postgres with server-verified roles.\n- An owned email platform: templates, campaigns, and customer messaging.\n- A documentation system written for users, admins, engineers, and a CTO — with architecture and sequence diagrams.\n\nI care about trade-offs, not just features, and about leaving a codebase a team can actually run.\n\nOpen to senior full-stack / frontend roles. Live demo and full docs: [your-url-here]\n\n#hiring #opentowork #fullstack #react",
    },
    {
      type: "code",
      language: "text",
      title: "Telegram — short update",
      code: "Shipped something I am proud of: a commerce app that owns its email instead of renting an ESP — your domain, your database, campaigns + customer messaging built in. Server-first and fully documented.\n\nLive: [your-url-here]\n\nWould love your feedback.",
    },
    {
      type: "code",
      language: "text",
      title: "GitHub README — project blurb",
      code: "A server-first e-commerce platform with an owned email system (templates, campaigns, customer messaging), Better Auth authentication on Neon Postgres, and a multi-audience documentation library with architecture diagrams.\n\nStack: Next.js (App Router, RSC), TypeScript, Neon Postgres, Prisma, Better Auth, Resend, Stripe, Tailwind.\n\nHighlights: React Server Components by default; a port/adapter data seam that makes the CMS swappable; server-enforced per-viewer access control; instant cache revalidation via CMS webhooks.\n\nLive demo: [your-url-here]",
    },
    {
      type: "heading",
      text: "Recruitment artifacts",
    },
    {
      type: "paragraph",
      text: "These are the pieces recruiters and interviewers actually ask for. Keep them ready so you never scramble to describe the project on the spot.",
    },
    {
      type: "code",
      language: "text",
      title: "CV / resume — project line",
      code: "Server-first e-commerce platform (Next.js, TypeScript, Neon Postgres) — Designed and built a production-grade store with an owned email system (block-based templates, campaigns, customer messaging) replacing a rented ESP, Better Auth authentication with server-enforced role-based access, and a multi-audience documentation library with architecture diagrams. Live: [your-url-here]",
    },
    {
      type: "code",
      language: "text",
      title: "STAR bullets — for interviews and applications",
      code: "Situation: E-commerce teams pay per-contact ESP fees and lose ownership of their audience data.\nTask: Build an owned email platform inside the app, without a marketing team or a paid ESP.\nAction: Designed a block-based template engine and campaign system on Resend + Neon Postgres, rendered server-side beside real order data, behind a port/adapter seam so the content source stays swappable.\nResult: Campaigns, transactional email, and 1:1 messaging run on the client's own domain at flat cost, operable by 1–2 non-marketing staff, with every send logged for audit.\n\nSituation: Gated admin and developer docs must not leak to unauthorized viewers.\nTask: Enforce access without shipping protected content to the browser.\nAction: Implemented per-viewer gating in a Server Component — the doc body is stripped server-side for viewers without the role, so it is never serialized.\nResult: A real security boundary, not CSS hiding, verified by inspecting the network payload.",
    },
    {
      type: "code",
      language: "text",
      title: "60-second verbal pitch",
      code: "It is a server-first e-commerce platform, but the part I am proudest of is that it owns its email. Instead of renting Klaviyo or Mailchimp and paying per contact, the app has its own template engine, campaigns, and customer messaging running on the client's domain and Postgres database — right beside the real order data, so emails can use actual order lines and product images. I put a port/adapter seam between the UI and the data source, so we can move from the local content to a Strapi CMS without rewriting the app. Auth and authorization are enforced on the server, and I documented the whole thing for four different audiences with architecture diagrams. It is live, and the docs are public if you want to see the depth.",
    },
    {
      type: "callout",
      variant: "note",
      title: "Interview prompt this answers",
      text: "'Tell me about a project you are proud of' and 'walk me through an architectural decision.' Practise the 60-second pitch out loud until it is natural, then let the interviewer pull on whichever thread interests them — cost, architecture, security, or docs.",
    },
    {
      type: "heading",
      text: "Hashtags and keywords",
    },
    {
      type: "list",
      items: [
        "Engineering reach: #nextjs #react #typescript #softwarearchitecture #webdev",
        "Business / founder reach: #ecommerce #startups #saas #marketing",
        "Hiring reach: #opentowork #hiring #fullstack #frontend (use sparingly — one or two, not a wall)",
        "Keep it to 3–5 tags per post; a wall of hashtags reads as spam and suppresses reach.",
      ],
    },
    {
      type: "heading",
      text: "Track what works",
    },
    {
      type: "table",
      title: "Signals worth watching",
      headers: ["Metric", "Why it matters"],
      rows: [
        ["Post impressions / reach", "Which angle (cost, architecture, docs) resonates — do more of the winner"],
        ["Profile views after a post", "Posts that convert readers into people checking you out"],
        ["Live-URL clicks", "Whether the demo link is compelling enough to click"],
        ["Inbound messages", "Recruiters or leads reaching out — the actual goal"],
        ["Saves / shares", "The strongest signal a post carried real value"],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Keep every claim true",
      text: "Only post what your deployment actually does. If two-way inbox or click tracking is still on the roadmap, say 'planned', not 'built'. One inflated claim that surfaces in an interview costs more than the post ever earned.",
    },
    {
      type: "callout",
      variant: "success",
      title: "The compounding effect",
      text: "Framing lives in the Showcase guide; this is the engine that runs on top of it. Post consistently for two weeks, keep the claims honest, and one project becomes an ongoing stream of senior-signalling content that keeps working while you sleep.",
    },
  ],
}
