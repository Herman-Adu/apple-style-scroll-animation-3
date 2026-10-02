---
name: vercel-ops
description: Vercel CLI and release operations for this repo - linked project, env pull and add, preview deploys, logs, inspecting builds, and the gated production release checklist for momo-audio.adudev.co.uk. Use for "deploy", "go live", "preview", "check logs", "env vars", "why did the build fail on Vercel", domains, cron, or any vercel command.
---

# Vercel operations

The project is linked (`.vercel/project.json`). Load the generic `vercel-cli` platform skill only for commands not covered here.

## Everyday (no gate)

```bash
vercel whoami && vercel project ls | head          # confirm account and link
vercel env ls                                       # names only; never print values
vercel env pull .env.local --environment=development
vercel deploy                                       # preview deploy, prints the URL
vercel logs <deployment-url>                        # runtime logs
vercel inspect <deployment-url> --logs              # build logs for a failed deploy
```

- Every merged PR already gets a preview deployment through the Git integration. Use `vercel deploy` only to test a branch that isn't pushed.
- New secrets: the user adds them in v0 Vars or the Vercel dashboard. If you're scripting it, `vercel env add NAME <env>` prompts for the value, so let the user type it. Never put a secret in chat, a commit or a log.

## Gated (explicit approval first)

- `vercel --prod`, `vercel promote`, `vercel alias`, domain changes, and removing env vars.
- Ask with the exact command and target, then wait. "ok" or "yes and..." isn't approval.

## Production release

Follow [the release checklist](references/release-checklist.md) step by step, and report each step as passed, failed or blocked.

## Debugging a failed Vercel build

1. `vercel inspect <url> --logs | tail -50` and find the first error.
2. Reproduce locally with `pnpm build`.
3. Fix it on a sprint branch, test first if it's a logic error, then follow the normal PR loop.
