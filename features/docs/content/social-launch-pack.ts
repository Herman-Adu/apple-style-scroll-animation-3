import type { Doc } from "../lib/domain/schema"
import { facts } from "@/lib/facts"
import { socialLaunchPackClientBlocks } from "./social-launch-pack-client"
import { socialLaunchPackRecruiterBlocks } from "./social-launch-pack-recruiter"

export const socialLaunchPack: Doc = {
  slug: "social-launch-pack",
  title: "Social Launch Pack: Recruiters & Clients",
  category: "Positioning",
  audience: "owner",
  access: "owner",
  summary:
    "Paste-ready LinkedIn, Telegram and X posts for two audiences: recruiters and hiring managers, and prospective clients who might buy a site or hire you to build one from this template. Every number is taken from the repo, every post respects its channel limit, and every link points at a public docs page.",
  readingMinutes: 12,
  order: 9,
  updatedAt: "2026-10-13",
  tags: ["social", "linkedin", "telegram", "x", "recruitment", "clients", "launch", "template"],
  body: [
    {
      type: "callout",
      variant: "info",
      title: "Before you post",
      text: "Replace [live URL] with the deployed site and [your name] in the DMs. Every link below is a public docs page, so anyone who clicks it can read it without signing in. Paste the link into a draft first and check the preview card renders before you publish.",
    },
    { type: "heading", text: "The two angles" },
    {
      type: "table",
      headers: ["Audience", "What they want to see", "Lead with", "Link to"],
      rows: [
        [
          "Recruiters and hiring managers",
          "Evidence of how you work, not only what you built",
          "Test-first delivery, architecture guardrails, permissions, written decisions",
          "/docs/engineering-quality and /docs/architecture-decision-records",
        ],
        [
          "Prospective clients",
          "A site they can own, change and hand to the next developer",
          "Store plus email in one system, tested foundation, real documentation",
          "/docs/email-seasonal-campaigns and /docs/case-study-email-platform",
        ],
      ],
    },
    { type: "heading", text: "Proof points you can quote" },
    {
      type: "table",
      headers: ["Claim", "Where it comes from"],
      rows: [
        [`${facts.repo.mergedPrs} reviewed pull requests, each squash-merged after checks pass`, `Merged PRs #1 to #${facts.repo.latestPr} on main`],
        [`${facts.tests.total.toLocaleString("en-GB")} automated tests, plus ${facts.tests.smoke} browser smoke tests and ${facts.tests.axe} accessibility (axe) checks`, "pnpm test, pnpm test:smoke, pnpm test:axe"],
        ["Deep imports across features: 116 down to 0", "Architecture health baseline vs pnpm arch"],
        ["Shared code depending on feature code: 16 down to 0", "Architecture health baseline vs pnpm arch"],
        ["any types: 28 down to 0. useEffect calls: 55 down to 31", "Architecture health baseline vs pnpm arch"],
        ["Every feature uses the same four folders: actions, data, domain, adapters", "Guard tests in qa/unit/meta"],
        ["Permissions checked in the request proxy, every server action and the UI", "Security and compliance posture doc"],
        ["Rules for AI coding agents live in the repo (AGENTS.md and skills)", "AGENTS.md and .agents/skills"],
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: "Keep claims accurate",
      text: "This is a template and a tested build, not a live business, so do not quote revenue, customers or client results. Scheduled email sends are built and tested but not switched on, so say built and tested, not live. Production go-live, Stripe live mode and compliance are set up per project. Check the availability line in the recruiter posts matches your situation before you publish.",
    },
    { type: "heading", text: "Profile and discoverability" },
    {
      type: "paragraph",
      text: "A post reaches a feed for a day; the profile is what a recruiter search returns for months. LinkedIn matches a recruiter's query against the headline, the About section and the skills list, and ranks a post partly against the profile it came from, so these fields do more for being found than any single post does. Fill all four in before the first post goes out, and keep the headline and the skills list in step: the terms you lead with in one are the terms you pin in the other.",
    },
    {
      type: "code",
      language: "text",
      title: "Profile headline - recruiter search",
      code: "Full-stack engineer | Next.js, TypeScript, PostgreSQL | Test-first, documented, handover-ready commerce builds",
    },
    {
      type: "code",
      language: "text",
      title: "Profile headline - client work",
      code: "I build commerce sites that own their own email | Next.js, Stripe, PostgreSQL | Documented and handed over so your team can run it without me",
    },
    {
      type: "code",
      language: "text",
      title: "Profile featured link line",
      code: "Next.js 16 commerce template with an email builder, role-based admin and public engineering docs: [live URL]/docs/engineering-quality",
    },
    {
      type: "code",
      language: "text",
      title: "Profile About section",
      code: `I am a full-stack engineer. I build commerce sites and the systems behind them, and I document them so the team that inherits the code can run it without me.

My current work is a Next.js 16 commerce platform I built end to end: TypeScript throughout, Prisma on PostgreSQL (Neon), Better Auth for sessions and roles, Stripe for checkout, Resend for delivery. It owns its own email - block-based templates, campaigns and customer messaging on the store's own domain and database - instead of renting an email service and copying products between tools.

How I work matters more than the feature list:

- Small pull requests, test-first. ${facts.repo.mergedPrs} are merged, each with the failing test written before the code.
- ${facts.tests.total.toLocaleString("en-GB")} automated tests, plus browser smoke tests and accessibility checks, run before anything merges.
- Permissions are verified on the server in three places: the request proxy, every server action and the UI. Gated content is never sent to a browser that lacks the role.
- Architecture rules are enforced by CI rather than by memory. A ratchet fails the build if deep imports, any types or useEffect counts get worse.
- All of it is written up in public docs with diagrams, for five audiences from a first-time user to a CTO.

What I am looking for: senior full-stack or product engineering work, permanent or contract. I am also available to build and hand over a commerce site for a business directly.

Read the engineering write-up rather than taking my word for it: [live URL]/docs/engineering-quality`,
    },
    {
      type: "paragraph",
      text: "Add the skills in this order. LinkedIn pins the first three to the top of the profile and weights them most heavily in recruiter search, so the first three are the terms the recruiter headline leads with. The rest are there to be matched rather than read, which is why the list names the thing a recruiter types (PostgreSQL, Test-Driven Development) rather than the thing you would say out loud.",
    },
    {
      type: "code",
      language: "text",
      title: "Profile skills, in the order to add them",
      code: `Next.js
TypeScript
PostgreSQL
React
Node.js
Full-Stack Development
Software Architecture
REST APIs
Prisma
Server-Side Rendering
Authentication
Role-Based Access Control
Stripe
Test-Driven Development
Playwright
Vitest
Continuous Integration
Web Accessibility
Technical Documentation
Tailwind CSS
SQL
Git
Vercel
Search Engine Optimisation
Email Marketing`,
    },
    {
      type: "callout",
      variant: "warning",
      title: "Open to Work: recruiters only, not the public badge",
      text: "Switch Open to Work on for recruiters only and leave the public green badge off. The badge is shown to every prospective client who opens the profile, and it reads as you leaving, which undercuts the argument that wins client work here: that you hand a build over so a team can run it without you. Recruiter-only mode is seen by the people actually searching, and gives up very little - one 2023 survey of hiring professionals found 91% say the public badge does not put them off a candidate, so the badge is not what gets you found. The #opentowork hashtag is public in the same way, so keep it to the recruiter posts.",
    },
    ...socialLaunchPackRecruiterBlocks,
    ...socialLaunchPackClientBlocks,
    { type: "heading", text: "Media to attach" },
    {
      type: "table",
      headers: ["Post", "Attach", "Why"],
      rows: [
        ["LinkedIn recruiter 1", "/showcase/social/email-case-study/carousel.pdf as a document post", "Swipeable carousels hold attention longest on LinkedIn."],
        ["LinkedIn recruiter 2", "/showcase/social/shared/squares/layers.png", "The layers image matches the folder structure story."],
        ["LinkedIn recruiter 3", "/showcase/social/shared/squares/locks.png", "Locks and permissions support the guardrails message."],
        ["LinkedIn client 1", "/showcase/social/email-case-study/starters.png", "Shows the seasonal email starters the post describes."],
        ["LinkedIn client 2", "/showcase/video/storefront/landscape.mp4", "Upload natively. A 30 second storefront walk-through sells the template."],
        ["LinkedIn client 3", "/showcase/social/email-case-study/history.png", "Version history is the visible proof of a safe handover."],
        ["LinkedIn and Facebook story", "/showcase/video/journey/4x5.mp4 (feed) or journey-9x16.mp4 (stories)", "One take from scroll story to admin shows the whole product end to end."],
        ["LinkedIn client story", "/showcase/video/restock/4x5.mp4 (feed) or restock-9x16.mp4 (stories)", "Sold out to back in stock in one take: proof the store turns demand into sales."],
        ["Telegram posts", "/showcase/social/email-case-study/cover.png", "One clean cover image previews well in chats."],
        ["X posts", "/showcase/social/shared/squares/starters.png", "One image per post; reuse the clip as the thread opener."],
      ],
    },
    {
      type: "image",
      src: "/showcase/social/shared/squares/layers.png",
      alt: "Square graphic of the platform's architecture layers, used with the recruiter architecture post.",
      caption: "Pair with LinkedIn recruiter 2.",
      width: 1080,
      height: 1080,
    },
    { type: "heading", text: "Infographic to commission next" },
    {
      type: "paragraph",
      text: "The architecture numbers are the strongest recruiter hook, and no image carries them yet. Ask v0 for a 1080 by 1350 infographic using the site's colour tokens and the brief below. Treat it as part of the launch, not an extra.",
    },
    {
      type: "code",
      language: "text",
      title: "Infographic brief - architecture guardrails",
      code: `Title: Architecture you can measure
Layout: four large before and after rows, one per metric, with a thin arrow between the numbers.
Rows: Deep imports, from 116. Shared code depending on features, from 16. any types, from 28. useEffect calls, from 55. The after numbers are read from .generated/facts.json when the slide renders, so run pnpm facts first.
Footer strip: Four folders per feature: actions, data, domain, adapters. CI fails the build if any number gets worse.
Style: the site's own design tokens, high contrast, one accent colour, large numerals, no decorative shapes.
Export: 1080 by 1350 PNG plus a 1080 by 1080 crop.`,
    },
    { type: "heading", text: "Posting plan for launch day" },
    {
      type: "steps",
      items: [
        { title: "Morning", text: "LinkedIn recruiter 1 with the carousel PDF. Reply to every comment in the first hour." },
        { title: "Late morning", text: "Telegram recruiter 1 in developer and founder channels. Then X recruiter 1." },
        { title: "Afternoon", text: "LinkedIn client 1 with the starters image. Telegram client 1 in founder and store owner channels." },
        { title: "Evening", text: "X client 1 and a short reply to any DMs using the DM templates." },
        { title: "Next days", text: "One post a day: recruiter 2, client 2 with the video, recruiter 3, client 3, then the remaining X posts." },
      ],
    },
    {
      type: "callout",
      variant: "tip",
      title: "Before every post",
      text: "Open the link in a private window, confirm the docs page loads without signing in, confirm the preview card shows, and read the post once for any claim you cannot back up in an interview.",
    },
  ],
}
