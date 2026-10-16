import type { DocBlock } from "../lib/domain/schema"
import { facts } from "@/lib/facts"
import { absoluteUrl } from "@/lib/seo/site"

// Quoted in posts that get pasted into a feed, so they are read from the last
// `pnpm facts` run rather than typed in and left to drift.
const tests = facts.tests.total.toLocaleString("en-GB")
const prs = facts.repo.mergedPrs

/** The deployed origin, so posting copy is ready to paste and a fork gets its own. */
const LIVE = absoluteUrl("")

/**
 * The personal profile, agreed 2026-10-16 (`docs/hand-off/profile-copy-s68.md`).
 * LinkedIn allows one personal profile, so this one is recruiter-first and the
 * client offer is a single closing line pointing at the Adu Dev company page.
 *
 * These are plain-text fields: LinkedIn renders no markdown, so the asterisks
 * and backticks the handoff uses for emphasis would paste as themselves.
 *
 * The Nexgen paragraph the handoff drafted for the About is not here. The
 * agreed About ran to 4,050 characters against a 2,600 ceiling, and Nexgen
 * already has its own Experience entry with a 2,000-character field of its own,
 * so the About was the one place it was being paid for twice.
 */
export const socialLaunchPackRecruiterProfileBlocks: DocBlock[] = [
  {
    type: "code",
    language: "text",
    title: "Profile headline - Herman Adu, LinkedIn personal",
    code: `Senior Full-Stack Engineer (Next.js · React · TypeScript · Prisma) — shipping production platforms for UK businesses. Test-first, CI-enforced architecture, docs the next team can use.`,
  },
  {
    type: "code",
    language: "text",
    title: "Profile About section - Herman Adu, LinkedIn personal",
    code: `I'm a full-stack engineer. I design and build the platforms businesses run their day on — and I build them so the next team can run them without me.

Momo Audio is my own commerce platform, built to show what my standard looks like when I control every variable. ${prs} pull requests, each one opened with a failing test written first. ${tests} automated tests plus browser smoke and accessibility checks before anything merges. Permissions verified on the server in three places — the request proxy, every server action, and the UI — so gated content never reaches a browser without the role. Architecture rules enforced by CI rather than by memory: a ratchet fails the build if deep imports, any types or useEffect counts get worse. And it owns its own email — block-based templates, campaigns and customer messaging on the store's own domain and database, rather than renting a service and copying products between tools. All of it documented publicly, with diagrams, for five audiences from a first-time user to a CTO.

On AI-assisted development: I run a Claude Code pipeline with custom agents, a hook system, structured skills and a Docker MCP stack (Caddy gateway, GitHub, Playwright, sequential-thinking, and a persistent knowledge-graph memory store so architectural decisions survive between sessions). On top of it I built a multi-project governance framework: structural enforcement hooks — scope-fence, controller-edit guard, manifest-freshness gate — per-agent model-floor routing that reserves premium models for judgement and review, and a tool-agnostic secret-safety scanner with exfiltration detection and post-execution redaction. It is genuinely faster, but it is only as good as the engineer directing it: the harness, the rules and the review standards are my engineering judgement written down. The tests and the CI ratchets exist precisely so that speed never becomes a quality trade.

Stack: TypeScript, Next.js (App Router, Server Components, Server Actions), React 19, Tailwind, Prisma, PostgreSQL/Neon, Better Auth and Clerk, Stripe, Resend, Strapi, Zod, React Hook Form, Zustand, Vitest, Playwright, Docker, GitHub Actions, Vercel. Currently playing with TanStack and Astro.

What I'm looking for: senior full-stack or product engineering work, permanent or contract, UK-based or remote.

Don't take my word for it — read the engineering write-up: ${LIVE}/docs/engineering-quality

For businesses who want a platform built and run for them rather than a hire, that's what I do through Adu Dev.`,
  },
]

export const socialLaunchPackRecruiterBlocks: DocBlock[] = [
  { type: "heading", text: "For recruiters and hiring managers" },
  {
    type: "paragraph",
    text: "Post these in order. The first shows how you work, the second shows a concrete refactor with numbers, and the third shows you set up the process for AI-assisted teams.",
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - recruiter 1: how I work",
    code: `Most portfolio projects show what you can build. I wanted mine to show how I work.

I started from a v0 template that was a single marketing page - a 192-frame scroll animation, a nav bar and a features grid. No cart, no checkout, no admin, no database, no auth.

Everything else I designed and built: the catalog and Stripe checkout, the entire admin dashboard, Better Auth with server-enforced roles, an owned email platform sending through Resend, and Prisma on Neon underneath it. AI-assisted throughout, and run like a team codebase:

- Every change is a small pull request. ${prs} are merged, each with the failing test written first.
- ${tests} automated tests, plus browser smoke tests and accessibility checks, run before anything merges.
- Permissions are checked in three places: the request proxy, every server action and the UI. Admin actions verify the caller themselves instead of trusting the page.
- Architecture rules are enforced by CI, not by memory. A ratchet fails the build if the codebase gets worse.

It is all written up in public docs, with diagrams, for users, developers and CTOs: ${LIVE}/docs/engineering-quality

If you are hiring for a senior full-stack or product engineering role, I would be glad to talk.`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - recruiter 2: the refactor with numbers",
    code: `I refactored the commerce platform I had built, without breaking it. The trick was making the architecture measurable.

First I wrote a script that runs in CI and counts the smells:

- Deep imports reaching into another feature's internals: 116, now 0
- Shared code that depended on feature code: 16, now 0
- Uses of any: 28, now 0
- useEffect calls: 55, now 31, with data loading moved to the server

Then every feature got the same four folders: actions, data, domain and adapters. Pure rules live in domain, I/O lives in data and adapters, and the only "use server" files are in actions. Tests enforce the layout, so a file in the wrong place fails the build.

The numbers only go one way. The CI ratchet blocks any pull request that makes them worse.

Decision records and diagrams: ${LIVE}/docs/architecture-decision-records`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - recruiter 3: rules for AI agents",
    code: `Something I added that most portfolio repos do not have: written rules for AI coding agents.

The repo has an AGENTS.md router and a set of small skills for the sprint workflow, test-first development, feature layout, schema changes and auth. Humans and agents read the same rules: never commit to main, write the failing test first, get every check green before merge, and stop for approval before anything touches production or secrets.

A test checks that every skill is routed and stays short, so the rules cannot quietly rot.

The point is simple. The same guardrails apply whether a change comes from me, a contractor or an assistant. That is the process I bring to a team.

How the workflow runs: ${LIVE}/docs/contributing-and-workflow`,
  },
  {
    type: "code",
    language: "text",
    title: "Telegram - recruiter 1: build log",
    code: `Build log: a Next.js 16 commerce template (Prisma on Neon, Better Auth, Stripe, Resend) that I run like a team codebase.

- ${prs} small PRs, test-first
- ${tests} automated tests plus browser smoke and accessibility checks
- CI ratchet on architecture: deep imports 116 to 0, any types 28 to 0
- Four folders per feature: actions, data, domain, adapters
- Permissions checked in proxy, server actions and UI

Decision records and diagrams are public: ${LIVE}/docs/architecture-decision-records`,
  },
  {
    type: "code",
    language: "text",
    title: "Telegram - recruiter 2: hiring channels",
    code: `Open to senior full-stack and product engineering conversations.

What I would bring: test-first delivery, architecture rules enforced in CI, permission checks that do not trust the UI, and documentation a new teammate can use on day one.

The evidence is public, not a CV claim: ${LIVE}/docs/engineering-quality

Message me here or on LinkedIn.`,
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 1",
    code: `Ran my Next.js 16 commerce project like a team codebase: ${prs} reviewed PRs, every one test-first, ${tests} automated tests plus browser and accessibility checks before merge. ${LIVE}/docs/engineering-quality`,
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 2",
    code: `Architecture guardrails in CI: deep imports 116 to 0, shared-to-feature inversions 16 to 0, any types 28 to 0. The build fails if a PR makes them worse. ${LIVE}/docs/architecture-decision-records`,
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 3",
    code: `Permission checks in three places: request proxy, every server action, the UI. The rules are small pure functions with their own tests. ${LIVE}/docs/security-and-compliance-posture`,
  },
  {
    type: "code",
    language: "text",
    title: "DM - recruiter",
    code: `Hi, thanks for getting in touch. The quickest way to see how I work is the public engineering write-up for a commerce platform I built: ${LIVE}/docs/engineering-quality

It covers the test-first delivery log, the permissions model and the architecture decisions, with diagrams. Happy to talk through any of it. What does the role involve day to day?

[your name]`,
  },
]
