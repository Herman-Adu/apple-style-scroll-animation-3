import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { SHOWCASE_FORMATS, formatFromEnv } from "../../scripts/lib/showcase-formats.mjs";

/**
 * Recording harness for the showcase demo clips. Kept out of the default
 * Playwright config so `pnpm test:e2e` never records video. Run through
 * `pnpm showcase:video`, which then converts the raw .webm files to .mp4.
 */
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.QA_BASE_URL ?? `http://localhost:${PORT}`;
const size = SHOWCASE_FORMATS[formatFromEnv(process.env.SHOWCASE_FORMAT)];

export default defineConfig({
  testDir: path.join(projectRoot, "qa"),
  testMatch: ["showcase/**/*.spec.ts"],
  outputDir: path.join(projectRoot, "test-results", "showcase", "runs"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    viewport: size,
    video: { mode: "on", size },
    colorScheme: "dark",
  },
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: "pnpm run dev",
        cwd: projectRoot,
        port: PORT,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { PORT: String(PORT) },
      },
});
