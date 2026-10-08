import type { DocBlock } from "../lib/domain/schema"
import { facts } from "@/lib/facts"

// Quoted in posts that get pasted into a feed, so they are read from the last
// `pnpm facts` run rather than typed in and left to drift.
const tests = facts.tests.total.toLocaleString("en-GB")
const prs = facts.repo.mergedPrs

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

I took a Next.js 16 commerce platform (Prisma on Neon, Better Auth, Stripe, Resend) and ran it like a team codebase:

- Every change is a small pull request. ${prs} are merged, each with the failing test written first.
- ${tests} automated tests, plus browser smoke tests and accessibility checks, run before anything merges.
- Permissions are checked in three places: the request proxy, every server action and the UI. Admin actions verify the caller themselves instead of trusting the page.
- Architecture rules are enforced by CI, not by memory. A ratchet fails the build if the codebase gets worse.

It is all written up in public docs, with diagrams, for users, developers and CTOs: [live URL]/docs/engineering-quality

If you are hiring for a senior full-stack or product engineering role, I would be glad to talk.`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - recruiter 2: the refactor with numbers",
    code: `I refactored a Next.js 16 commerce codebase without breaking it. The trick was making the architecture measurable.

First I wrote a script that runs in CI and counts the smells:

- Deep imports reaching into another feature's internals: 116, now 0
- Shared code that depended on feature code: 16, now 0
- Uses of any: 28, now 0
- useEffect calls: 55, now 31, with data loading moved to the server

Then every feature got the same four folders: actions, data, domain and adapters. Pure rules live in domain, I/O lives in data and adapters, and the only "use server" files are in actions. Tests enforce the layout, so a file in the wrong place fails the build.

The numbers only go one way. The CI ratchet blocks any pull request that makes them worse.

Decision records and diagrams: [live URL]/docs/architecture-decision-records`,
  },
  {
    type: "code",
    language: "text",
    title: "LinkedIn - recruiter 3: rules for AI agents",
    code: `Something I added that most portfolio repos do not have: written rules for AI coding agents.

The repo has an AGENTS.md router and a set of small skills for the sprint workflow, test-first development, feature layout, schema changes and auth. Humans and agents read the same rules: never commit to main, write the failing test first, get every check green before merge, and stop for approval before anything touches production or secrets.

A test checks that every skill is routed and stays short, so the rules cannot quietly rot.

The point is simple. The same guardrails apply whether a change comes from me, a contractor or an assistant. That is the process I bring to a team.

How the workflow runs: [live URL]/docs/contributing-and-workflow`,
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

Decision records and diagrams are public: [live URL]/docs/architecture-decision-records`,
  },
  {
    type: "code",
    language: "text",
    title: "Telegram - recruiter 2: hiring channels",
    code: `Open to senior full-stack and product engineering conversations.

What I would bring: test-first delivery, architecture rules enforced in CI, permission checks that do not trust the UI, and documentation a new teammate can use on day one.

The evidence is public, not a CV claim: [live URL]/docs/engineering-quality

Message me here or on LinkedIn.`,
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 1",
    code: `Ran my Next.js 16 commerce project like a team codebase: ${prs} reviewed PRs, every one test-first, ${tests} automated tests plus browser and accessibility checks before merge. [live URL]/docs/engineering-quality`,
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 2",
    code: "Architecture guardrails in CI: deep imports 116 to 0, shared-to-feature inversions 16 to 0, any types 28 to 0. The build fails if a PR makes them worse. [live URL]/docs/architecture-decision-records",
  },
  {
    type: "code",
    language: "text",
    title: "X - recruiter 3",
    code: "Permission checks in three places: request proxy, every server action, the UI. The rules are small pure functions with their own tests. [live URL]/docs/security-and-compliance-posture",
  },
  {
    type: "code",
    language: "text",
    title: "DM - recruiter",
    code: `Hi, thanks for getting in touch. The quickest way to see how I work is the public engineering write-up for a commerce platform I built: [live URL]/docs/engineering-quality

It covers the test-first delivery log, the permissions model and the architecture decisions, with diagrams. Happy to talk through any of it. What does the role involve day to day?

[your name]`,
  },
]
