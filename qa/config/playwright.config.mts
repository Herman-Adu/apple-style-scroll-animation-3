import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"

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
const projectRoot = fileURLToPath(new URL("../..", import.meta.url))
const PORT = Number(process.env.PORT ?? 3000)
const baseURL = process.env.QA_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: path.join(projectRoot, "qa"),
  testMatch: ["smoke/**/*.spec.ts", "seo/**/*.spec.ts", "axe/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        cwd: projectRoot,
        port: PORT,
        reuseExistingServer: true,
        timeout: 120_000,
      },
})
