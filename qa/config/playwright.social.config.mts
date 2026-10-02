import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

/**
 * Export harness for the social launch assets. Kept out of the default config
 * so `pnpm test:e2e` never writes files into public/. Run via `pnpm showcase:assets`.
 */
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.QA_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: path.join(projectRoot, "qa"),
  testMatch: ["social/**/*.spec.ts"],
  outputDir: path.join(projectRoot, "test-results", "social"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    deviceScaleFactor: 1,
    colorScheme: "dark",
  },
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: "pnpm run dev:local",
        cwd: projectRoot,
        port: PORT,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { PORT: String(PORT) },
      },
});
