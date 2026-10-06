import type { Doc } from "../lib/domain/schema"
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
  order: 6,
  updatedAt: "2026-10-06",
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
        ["More than 140 reviewed pull requests, each squash-merged after checks pass", "Merged PRs #1 to #146 on main"],
        ["758 automated tests, plus 9 browser smoke tests and 5 accessibility (axe) checks", "pnpm test, pnpm test:smoke, pnpm test:axe"],
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
    { type: "heading", text: "Profile copy to update first" },
    {
      type: "code",
      language: "text",
      title: "Profile headline",
      code: "Full-stack engineer | Next.js, TypeScript, Postgres | Test-first, documented, handover-ready commerce builds",
    },
    {
      type: "code",
      language: "text",
      title: "Profile featured link line",
      code: "Next.js 16 commerce template with an email builder, role-based admin and public engineering docs: [live URL]/docs/engineering-quality",
    },
    ...socialLaunchPackRecruiterBlocks,
    ...socialLaunchPackClientBlocks,
    { type: "heading", text: "Media to attach" },
    {
      type: "table",
      headers: ["Post", "Attach", "Why"],
      rows: [
        ["LinkedIn recruiter 1", "/showcase/social/linkedin-carousel.pdf as a document post", "Swipeable carousels hold attention longest on LinkedIn."],
        ["LinkedIn recruiter 2", "/showcase/social/square-layers.png", "The layers image matches the folder structure story."],
        ["LinkedIn recruiter 3", "/showcase/social/square-locks.png", "Locks and permissions support the guardrails message."],
        ["LinkedIn client 1", "/showcase/social/carousel-starters.png", "Shows the seasonal email starters the post describes."],
        ["LinkedIn client 2", "/showcase/video/storefront.mp4", "Upload natively. A 30 second storefront walk-through sells the template."],
        ["LinkedIn client 3", "/showcase/social/carousel-history.png", "Version history is the visible proof of a safe handover."],
        ["Telegram posts", "/showcase/social/carousel-cover.png", "One clean cover image previews well in chats."],
        ["X posts", "/showcase/social/square-starters.png", "One image per post; reuse the clip as the thread opener."],
      ],
    },
    {
      type: "image",
      src: "/showcase/social/square-layers.png",
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
Rows: Deep imports 116 to 0. Shared code depending on features 16 to 0. any types 28 to 0. useEffect calls 55 to 31.
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
