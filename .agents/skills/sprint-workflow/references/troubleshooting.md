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

It does not take a recording pass. In S62 one `pnpm facts` (which runs Vitest with coverage) plus one full smoke run was enough: `/about` and `/contact` returned 500 while `curl` returned 200, and the dev server Playwright had booted 30 minutes earlier was holding 5.7 GB. Read the working set before reading the failures — `Get-NetTCPConnection -LocalPort 3000 -State Listen` gives the PID, `Get-Process` the memory — because a failure on routes the sprint never touched is the tell. `pnpm health` showed 15% free at the same moment.

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
Not flaky tests and not the code: the machine has no memory headroom, so Playwright's default worker count oversubscribes it. Never assertion failures, always timeouts. Since S49 the gate config caps local runs at two workers, so `pnpm test:smoke` passes 24/24 with nothing to remember, and CI keeps the default because the runner is its own machine. Passing `--workers` by hand is obsolete: the config applies the cap for you, and `PW_WORKERS` is the supported way to override it. If it still times out, the machine is the cause and not the count: run `pnpm health`, close what is holding memory, and only then go lower with `PW_WORKERS=1 pnpm test:smoke`. Measured on Oct 9, 2026: 4.4 GB free of 31.7 GB, with Chrome holding 7.5 GB across 57 processes and VS Code 4.7 GB across 55. `pnpm health` prints the headroom and warns under 20%.

## Smoke fails on pages that look broken, and some of it passes
Check which app answered before reading the failures. The gate reuses whatever is listening on `PORT`, so another repo's dev server on 3000 gets tested instead: on Oct 13, 2026 that was a resume builder, and the suite reported 8 passes among 16 failures with nothing naming the cause. The `app-identity` project now fails first and prints the name it found. Free the port, or give the gate its own with `PORT=3100 NEXT_PUBLIC_SITE_URL=http://localhost:3100 pnpm test:smoke` - the origin has to move with the port or the SEO canonicals fail instead.

## Smoke fails with `SyntaxError: Unexpected end of JSON input`
Repeated `pnpm showcase:assets` runs leave `.next` half-written. Clear it with `pnpm clean` and re-run. This is the one case where deleting `.next` is right; mid-sprint, prefer the workaround in the Turbopack entry above, because a cold rebuild costs minutes.

## `pnpm showcase:assets` cannot fix a snapshot a failing test depends on
It runs `pnpm facts` first, and `facts` runs Vitest. A red suite writes nothing, so the snapshot a red test needs can never be regenerated through this path. Break the cycle by exporting directly: `pnpm exec playwright test --config qa/config/playwright.social.config.mts`.

## The machine slows down across days and `git status` is clean
Nothing in the repo shows it. Run `pnpm health`. On Oct 9, 2026 it was nine live Claude Code sessions - eight of them finished work left open, 133 processes and about 1.15 GB with their MCP servers - plus 289 MB in `.next` and `test-results`, all gitignored. `pnpm clean` takes the disk side. Sessions are only ever reported: age cannot distinguish an abandoned session from a busy one, so close them from their own window, or `taskkill /PID <pid> /T /F` after checking. Never script that kill.

## CI `app` job fails in about 30s having run no tests
Read the log before re-running. `toomanyrequests: You have reached your unauthenticated pull rate limit` on `docker pull postgres:16` in "Initialize containers" is Docker Hub's shared-IP limit on GitHub runners, not the branch. `gh run rerun <id> --failed` once, usually on a different runner IP, clears it. Do not loop; each attempt burns quota.

## A commit on `main` went through, or the hook never ran
The hook is tracked in `.githooks/` and only runs once `core.hooksPath` points there, which `postinstall` does - so a clone installed with `--ignore-scripts`, or a worktree added before S53, has no hook and fails open silently. Check with `git config --get core.hooksPath` and run `node scripts/install-hooks.mjs` if it is unset. The refusal itself names `ALLOW_COMMIT_ON_MAIN` for the case you really mean it; staged work is never touched either way.

## A `pnpm <name>` script prints nothing and exits 0
The name collides with a pnpm built-in, which wins silently. `doctor` is one, which is why the health command is `pnpm health`. `pnpm run <name>` reaches the script, but rename it instead: `qa/unit/meta/housekeeping.test.ts` fails if any script is named after a built-in.

## Inspecting the docs corpus ad hoc

There is no script runner for the TypeScript content modules: `vite-node` and
`tsx` are not installed, and `node` cannot import `features/docs/content/` or
resolve `@/`. Write a throwaway test under `qa/unit/` instead and run it with
the project config. Vitest's reporter swallows `console.log` on a passing test,
so have the test **write its output to a file** (`C:/tmp/...`, an allowed
working directory) and read that. Delete the file before committing. This is
how S59 enumerated the 55 docs by category, access and audience, and how it
confirmed which objection terms were missing from the public layer - counting
the corpus with a script rather than trusting the plan's numbers.

## Reading the pixels a page actually painted

No image-decoding dependency is installed, and none is needed. Take the
screenshot, hand it back to the page as a base64 `data:` URL, draw it into a 2D
canvas and read `getImageData` - `qa/smoke/about-timeline.spec.ts` does this,
and `qa/smoke/showcase-brand.spec.ts` uses the same canvas round-trip to
normalise a computed colour so any colour space resolves.

Reach for it when the defect lives *below* computed style. Chromium reports
`oklch(...)` at full strength no matter how faintly a thing is really drawn,
because blending happens at rasterisation: a sub-device-pixel line, a colour on
a near-identical background, or anything a screenshot would settle. Note that
`devices["Desktop Chrome"]` - what the smoke and axe projects use - is
`deviceScaleFactor: 1`, so the suite already runs at the density where
hairline rendering problems appear, and a retina dev machine does not.

## Reading a showcase re-export's binary diff

"The export is deterministic, byte-identical files" was repo folklore and S64
measured it false. Across S48's export and S64's, 57 of 64 PNGs matched, but
**all 9 PDFs change every run** - Chromium writes a creation date and a document
id, and three of them changed with no change in size at all - and the two
mermaid slides re-lay out. So a diff showing eleven changed files after a
re-export is the floor, not a signal.

Read the diff by *which* slides changed, never by how many. `git diff --stat`
over `public/showcase/` and then subtract the PDFs and the mermaid pair; what
is left is the set that genuinely re-rendered. A re-export that touches only
those eleven changed nothing a reader would see.

## `tsc` rejects a BigInt literal
`error TS2737: BigInt literals are not available when targeting lower than ES2020`. `tsconfig.json` compiles with `target: "ES6"`, and raising it is a config change that drags `pnpm build` into a sprint that never asked for one. Write the constants through the constructor instead - `BigInt("0xcbf29ce484222325")` - which typechecks under ES6 and runs identically. S65 hit this writing a 64-bit hash; the `bigint` type itself is fine, because `lib` already includes `esnext`.

## axe is red on a colour every static guard says is fixed
The stylesheet is not what the browser paints. `buildThemeCss` renders the active theme template as a `:root` / `.dark` block in an inline `<style>` *after* `app/globals.css`, and `StoreSettings.theme` stores a full copy of every installed template - so for any store that has ever activated a preset, the database holds the palette and wins the cascade. S66 lost most of a session here: `app/globals.css`, `TITANIUM_TEAL` and the token-floor tests all said light `--accent-teal` was 0.51, and axe kept measuring the 0.58 the column remembered. Read the served page first:

```bash
curl -s http://localhost:3000/products -o page.html
node -e 'const h=require("fs").readFileSync("page.html","utf8");console.log([...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).find(s=>s.includes("--accent-teal")))'
```

`qa/unit/theme/theme-preset-contrast.test.ts` now compares the preset to the stylesheet token for token, and `normalizeThemeState` refreshes an unedited snapshot, so this specific gap is closed - but the layering is permanent.

## A Playwright click times out at 30s on a control that is plainly there
The thing it opens may already be open, covering the control. S66's new cart-drawer scan waited the full 30s on `getByLabel(/^Open cart/).click()` because adding to the cart opens the drawer itself, so the open dialog sat over the button - and the test reported a timeout, not a contrast result, which is why the violation it existed to find went unseen for a run. Playwright says so in the error: it lists the elements intercepting the pointer, from `<aside role="dialog">`. Guard the click with the end state instead of assuming the control is needed:

```ts
const drawer = page.getByRole("dialog", { name: "Shopping cart" })
if (!(await drawer.isVisible().catch(() => false))) await page.getByLabel(/^Open cart/).click()
await expect(drawer).toBeVisible()
```

## `page.evaluate(someString, arg)` hands the page callback `undefined`
Playwright accepts a *function* or a *string* as the page function, and the two behave differently: a string is evaluated as an expression and its value returned, so a string holding `(x) => {...}` evaluates to a function, which is not serialisable and arrives back as `undefined` - the `arg` is never passed to it. S67 wrote a browser probe this way and spent a run on `Cannot read properties of undefined`. Pass a real function declared at module scope instead; Playwright sends its source, so it may close over nothing in the spec file:

```ts
function measureProbe(classes: string) { /* runs in the page; no closure over the spec */ }
const probe = await page.evaluate(measureProbe, "text-destructive-strong")
```

## Running a repo TS module ad hoc, to measure something before writing a test
There is no `tsx` here, and `node` cannot resolve this repo's `@/` aliases, so a quick measurement with something like `qa/config/contrast.ts` has no obvious runner. Vitest is the wrong tool for an exploratory sweep - every temporary file under `qa/unit` moves the counts that `qa/unit/meta` and the fact snapshot assert. Copy the module into the scratchpad with its one aliased import inlined and run it under Node's own type stripping:

```bash
sed 's#import { REPO_ROOT } from "@/qa/config/repo-root"#const REPO_ROOT = process.env.REPO_ROOT as string#' \
  qa/config/contrast.ts > "$SCRATCH/contrast.ts"
REPO_ROOT="$PWD" node --experimental-strip-types "$SCRATCH/measure.ts"
```

S67 used this to sweep lightness against both roles and both themes before writing a line of the test, which is how it found that the handoff's proposed per-theme split could not work. Measuring with the repo's own model matters: a reimplementation of the arithmetic would have agreed with itself.

## `--reporter=basic` is not a reporter on Vitest 5
`vitest run --reporter=basic` aborts before collecting anything with `Failed to load custom Reporter from basic` / `Failed to load url basic`, because the name was dropped in Vitest 5 and the flag is read as a module path. The default reporter already prints a per-test list, so pass no reporter at all - and run the suite through its config the way the scripts do, since a bare `pnpm vitest run <path>` picks up none:

```bash
pnpm vitest run --config qa/config/vitest.config.mts qa/unit/docs/social-launch-pack.test.ts
```

## Backslash escapes collapse on the way into a heredoc
Writing a patch script inline, a doubled backslash can reach the interpreter as a single one even inside a quoted heredoc (`<<'PY'`). S68 lost two cycles to it, then a third while writing this entry: `"\n\n"` arrived as a real newline and broke the TypeScript string it was meant to write, and `C:\Users` raised `truncated \UXXXXXXXX escape`. Three habits avoid it - build the escape rather than typing it, make every literal path a raw string, and keep backslashes out of the heredoc altogether when the text is *about* backslashes:

```python
esc = chr(92) + "n"                 # instead of a typed escape surviving the trip
block = r"""...C:\Users\herma..."""  # raw, so a lone backslash stays one
body = TEMPLATE.replace("<BS>", chr(92))  # or no backslash in the source at all
```

Either way, assert the anchor exists before writing (`assert old in s`) so a collapsed escape fails loudly instead of writing a broken file.
