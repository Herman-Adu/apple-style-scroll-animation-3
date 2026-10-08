import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
import { SHOWCASE_FORMATS } from "../../scripts/lib/showcase-formats.mjs";

/**
 * Caption preview. Renders every caption on its own route at every recording
 * size and writes one screenshot per shot, so placement can be checked in a
 * couple of minutes instead of a fifteen-minute recording run.
 */
const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
for (const file of [".env.local", ".env.development.local"]) {
  const envPath = path.join(projectRoot, file);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

const PORT = Number(process.env.PORT ?? 3000);

export default defineConfig({
  testDir: path.join(projectRoot, "qa", "preview"),
  testMatch: ["**/*.spec.ts"],
  outputDir: path.join(projectRoot, "test-results", "preview"),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 600_000,
  use: {
    baseURL: process.env.QA_BASE_URL ?? `http://localhost:${PORT}`,
    colorScheme: "dark",
    video: "off",
  },
  projects: Object.entries(SHOWCASE_FORMATS).map(([name, viewport]) => ({ name, use: { viewport } })),
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
