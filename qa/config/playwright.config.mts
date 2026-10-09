import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright owns the browser-backed layers against a real running app:
 *  - smoke: every route returns 200, renders, no console errors
 *  - seo:   sitemap / robots / rss / OG images / JSON-LD / canonicals
 *  - axe:   accessibility scans (WCAG 2 A/AA)
 *
 * `webServer` boots the app if one isn't already listening on PORT, so the
 * suite runs the same locally and in CI. Point tests at a deployed URL instead
 * by setting QA_BASE_URL.
 */
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

// One port everywhere: CI serves the production build on it and locally we
// reuse the dev server on it, so BETTER_AUTH_URL and NEXT_PUBLIC_SITE_URL read
// the same in the workflow and in .env.local.
// The port Playwright waits on MUST be the port the command listens on.
const isCI = !!process.env.CI;
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.QA_BASE_URL ?? `http://localhost:${PORT}`;
const serverCommand = isCI
  ? `pnpm exec next start -p ${PORT}`
  : `pnpm exec next dev -p ${PORT}`;

export default defineConfig({
  testDir: path.join(projectRoot, "qa"),
  testMatch: ["smoke/**/*.spec.ts", "seo/**/*.spec.ts", "axe/**/*.spec.ts"],
  // Playwright empties outputDir before every run, and the default is the whole
  // of test-results — which is where the showcase recordings live. Without this,
  // running the browser gates deletes the raw clips a recording pass just made.
  outputDir: path.join(projectRoot, "test-results", "e2e"),
  fullyParallel: true,
  // This machine runs out of memory before it runs out of cores. At Playwright's
  // default worker count smoke failed 2-5 tests a run on 30s `page.goto`
  // timeouts — different tests each time, never assertions — because Chrome and
  // the editor leave under 20% of 31.7 GB free. Two workers passes 24/24. CI
  // gets a machine to itself, so it keeps the default. `PW_WORKERS` overrides.
  workers: isCI ? undefined : Number(process.env.PW_WORKERS ?? 2),
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? "line" : "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: serverCommand,
        cwd: projectRoot,
        port: PORT,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { PORT: String(PORT) },
      },
});
