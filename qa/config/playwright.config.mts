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

// CI serves the production build on 3001 to match BETTER_AUTH_URL and
// NEXT_PUBLIC_SITE_URL in the workflow; locally we reuse the dev server on 3000.
// The port Playwright waits on MUST be the port the command listens on.
const isCI = !!process.env.CI;
const PORT = Number(process.env.PORT ?? (isCI ? 3001 : 3000));
const baseURL = process.env.QA_BASE_URL ?? `http://localhost:${PORT}`;
const serverCommand = isCI
  ? `pnpm exec next start -p ${PORT}`
  : `pnpm exec next dev -p ${PORT}`;

export default defineConfig({
  testDir: path.join(projectRoot, "qa"),
  testMatch: ["smoke/**/*.spec.ts", "seo/**/*.spec.ts", "axe/**/*.spec.ts"],
  fullyParallel: true,
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
