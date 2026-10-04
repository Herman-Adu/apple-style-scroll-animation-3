/**
 * Root entry so editors (VS Code Vitest extension, WebStorm) that auto-discover
 * `vitest.config.*` pick up the real config: the `@/` and `server-only` aliases,
 * the setup file and the qa/unit + qa/integration include globs.
 *
 * The CLI scripts still pass `--config qa/config/vitest.config.mts` explicitly;
 * both routes load the same file. Edit `qa/config/vitest.config.mts`, not this one.
 */
import config from "./qa/config/vitest.config.mts";

export default config;
