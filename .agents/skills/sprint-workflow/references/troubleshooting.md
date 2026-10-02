# Troubleshooting (found during S0–S4)

## Uncommitted work disappeared
The workspace was switched to a new `v0/...` branch from `main`. Check `git stash list` and the old branch first. In v0, saved tool records under `user_read_only_context/tool_content/tool-history/` hold full Write/Edit contents. Prevention: push WIP to the sprint branch early.

## `origin/main` is stale or missing
Use `git fetch origin +refs/heads/main:refs/remotes/origin/main`. Fallback: `git fetch origin main && git checkout -B v0/<name> FETCH_HEAD`.

## "Pulling changes from main" happened mid-sprint
Re-run Orient. Confirm the sprint branch still exists and `git diff --stat origin/main` shows only sprint files.

## pnpm skipped a package's install script (e.g. ffmpeg-static)
Add it to `pnpm.onlyBuiltDependencies` in `package.json`, then `pnpm rebuild <pkg>`. Verify: `node -e "console.log(require('ffmpeg-static'))"`.

## Playwright: no browser / `libnspr4.so` missing
`pnpm exec playwright install chromium`, then one attempt at `pnpm exec playwright install-deps chromium`. If it still fails, report the check as blocked; don't loop.

## Video poster is a blank frame
The page was still loading at grab time. `scripts/showcase-video.mjs` grabs at 8s; a jpg of a few KB means blank.

## Axe colour-contrast failure on `/` that "comes and goes"
  Not flaky: it only shows while the hero loader is on screen, so it depends on how fast frames load. W1b traced it to the loader's `Loading N%` text (`text-on-media/30`, 2.47:1); fixed at `/70`. If it recurs, log the failing nodes (`v.nodes[].target`, `html`) from the axe spec instead of rerunning, and treat anything visible during loading as in scope.

## Vitest can't resolve `@/...`
`vitest` ran without `--config qa/config/vitest.config.mts`. Use the `pnpm test:*` scripts.

## Headless tooling hits `/admin` and gets 307 to `/sign-in`
Admin routes are gated by the proxy. Render public-safe material from a noindex route outside `/admin` (as `/showcase-render/[asset]` does), or ask the user to add `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` under Vars.
