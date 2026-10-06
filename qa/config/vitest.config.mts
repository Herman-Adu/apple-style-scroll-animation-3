import { fileURLToPath } from "node:url"
import path from "node:path"
import { defineConfig } from "vitest/config"

/**
 * Vitest runs the fast, browserless layers: `qa/unit` and `qa/integration`.
 * Playwright owns the browser layers (`qa/smoke`, `qa/seo`, `qa/axe`) via its
 * own config, so they are excluded here.
 *
 * Two aliases keep server modules importable in a plain Node test process:
 *  - `server-only` -> an empty stub (the real package throws off-server).
 *  - `@/` -> project root, mirroring tsconfig `paths`.
 */
const projectRoot = fileURLToPath(new URL("../..", import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      "server-only": path.join(projectRoot, "qa/config/stubs/server-only.ts"),
      "@": projectRoot,
    },
  },
  test: {
    root: projectRoot,
    environment: "node",
    globals: true,
    // The first test in some email action files cold-imports a large module graph, which can take over the 5s default on slower machines.
    testTimeout: 20_000,
    setupFiles: [path.join(projectRoot, "qa/config/setup/vitest.setup.ts")],
    include: ["qa/unit/**/*.test.ts", "qa/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: path.join(projectRoot, "qa/.coverage"),
      include: ["features/**/lib/**/*.{ts,tsx}", "features/**/api/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
      exclude: ["**/*.d.ts"],
      reporter: ["text-summary", "json-summary"],
    },
  },
})
