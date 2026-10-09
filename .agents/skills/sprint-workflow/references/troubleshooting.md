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

## Smoke fails 2-5 tests on 30s `page.goto` timeouts, different ones each run
Not flaky tests and not the code: the machine has no memory headroom, so Playwright's default worker count oversubscribes it. Never assertion failures, always timeouts. Run `pnpm exec playwright test --config qa/config/playwright.config.mts smoke --workers=2` and it passes 24/24. Measured on Oct 9, 2026: 4.4 GB free of 31.7 GB, with Chrome holding 7.5 GB across 57 processes and VS Code 4.7 GB across 55. `pnpm health` prints the headroom and warns under 20%. CI is unaffected; the runner is its own machine.

## Smoke fails with `SyntaxError: Unexpected end of JSON input`
Repeated `pnpm showcase:assets` runs leave `.next` half-written. Clear it with `pnpm clean` and re-run. This is the one case where deleting `.next` is right; mid-sprint, prefer the workaround in the Turbopack entry above, because a cold rebuild costs minutes.

## `pnpm showcase:assets` cannot fix a snapshot a failing test depends on
It runs `pnpm facts` first, and `facts` runs Vitest. A red suite writes nothing, so the snapshot a red test needs can never be regenerated through this path. Break the cycle by exporting directly: `pnpm exec playwright test --config qa/config/playwright.social.config.mts`.

## The machine slows down across days and `git status` is clean
Nothing in the repo shows it. Run `pnpm health`. On Oct 9, 2026 it was nine live Claude Code sessions - eight of them finished work left open, 133 processes and about 1.15 GB with their MCP servers - plus 289 MB in `.next` and `test-results`, all gitignored. `pnpm clean` takes the disk side. Sessions are only ever reported: age cannot distinguish an abandoned session from a busy one, so close them from their own window, or `taskkill /PID <pid> /T /F` after checking. Never script that kill.

## CI `app` job fails in about 30s having run no tests
Read the log before re-running. `toomanyrequests: You have reached your unauthenticated pull rate limit` on `docker pull postgres:16` in "Initialize containers" is Docker Hub's shared-IP limit on GitHub runners, not the branch. `gh run rerun <id> --failed` once, usually on a different runner IP, clears it. Do not loop; each attempt burns quota.

## A `pnpm <name>` script prints nothing and exits 0
The name collides with a pnpm built-in, which wins silently. `doctor` is one, which is why the health command is `pnpm health`. `pnpm run <name>` reaches the script, but rename it instead: `qa/unit/meta/housekeeping.test.ts` fails if any script is named after a built-in.
