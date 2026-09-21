import { beforeEach, vi } from "vitest"

/**
 * Global test setup. Keeps every test isolated by resetting module state and
 * environment stubs between cases — important because the feature `api` layers
 * read `env.STRAPI_API_URL` once at module load, so tests that exercise the
 * Strapi path vs. the local-data fallback must re-import with a fresh registry.
 */
beforeEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})
