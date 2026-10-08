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
`pnpm exec playwright install chromium`. The sandbox is Amazon Linux 2023 (`dnf`, no `apt-get`), so `playwright install-deps` cannot work. Install the libraries with `sudo -n dnf install -y nspr nss nss-util atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXfixes libXrandr mesa-libgbm alsa-lib pango cairo`, then confirm with a one-line `chromium.launch()`. If that fails, report the check as blocked; don't loop.

## Recordings vanish when the test suite runs
Playwright empties `outputDir` before every run and defaults it to the whole of `test-results`, where the showcase raw clips live. Running the browser gates therefore deleted the clips a recording pass had just made — twice in S42, costing two full re-records. Every config now sets its own folder and `qa/unit/meta/playwright-configs.test.ts` fails if one does not.

## Check before you spend, not after
A recording pass costs about fifteen minutes; the check that reproduces its failure modes costs forty seconds. In S42 three faults reached published clips — an error screen, a sign-in wall, a sixteen-second frozen frame — and every one of them reproduced instantly in the browser. Before any expensive generate-or-render step, run the cheap thing that would catch it: here, `pnpm showcase:check` and `pnpm showcase:captions`.

## A recorded clip runs longer than its pacing says
`page.mouse.wheel` costs about 20ms of its own, on top of whatever you wait. A sleep per step therefore drifts: in S41 a 12-second frame sequence took 16. Drive the steps from the clock — wait until step `i` is *due* (`startedAt + (i + 1) * pause`) rather than sleeping a fixed amount. Measure the real cost before trusting a pacing number; the plan's estimate was out by a third.

## Video poster is a blank frame
The page was still loading at grab time. `scripts/showcase-video.mjs` grabs at 8s; a jpg of a few KB means blank.

## The browser gates suddenly 500 on pages that work in a browser
A long-lived `pnpm dev` degrades after heavy use — a recording pass, a 67-slide export — and then answers 500 under the parallel smoke suite while `curl` on the same URL still returns 200. It is the server, not the code. Restart it (`taskkill /F /PID $(netstat -ano | findstr :3000)`, then `pnpm dev`) and re-run; it happened three times in S42-S44 and the re-run was clean every time.

## An intermittent axe failure is usually real, not flaky
S43: `/` failed about two runs in three. It was not timing noise — `text-foreground/40` genuinely failed AA on five elements, and axe only saw them once their scroll-reveal animation finished, so catching them depended on how fast the hero frames loaded. Print the offending selectors (`v.nodes[].target`) rather than rerunning until it passes; the spec does this now.

## Axe colour-contrast failure on `/` that "comes and goes"
  Not flaky: it only shows while the hero loader is on screen, so it depends on how fast frames load. W1b traced it to the loader's `Loading N%` text (`text-on-media/30`, 2.47:1); fixed at `/70`. If it recurs, log the failing nodes (`v.nodes[].target`, `html`) from the axe spec instead of rerunning, and treat anything visible during loading as in scope.

## Vitest can't resolve `@/...`
`vitest` ran without `--config qa/config/vitest.config.mts`. Use the `pnpm test:*` scripts.

## Preview: "Expected export to be in eval context" after pulling main
Turbopack is serving a cached copy of the named file from before the pull; the code is fine (the error's export list is the old one). A restart or `touch` does not clear it. Add a harmless line to that file, wait for `/` to load, then remove it. Don't delete `.next` without asking.

## Push rejected: "refusing to allow a GitHub App to create or update workflow"
The v0 GitHub app lacks the `workflows` permission. The user accepts it in GitHub (Settings > Applications > Vercel > Review request). Until then, keep `.github/workflows/*` out of the sprint commit and hand the user the exact YAML.

## Headless tooling hits `/admin` and gets 307 to `/sign-in`
Admin routes are gated by the proxy. Render public-safe material from a noindex route outside `/admin` (as `/showcase-render/[asset]` does), or ask the user to add `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` under Vars.
