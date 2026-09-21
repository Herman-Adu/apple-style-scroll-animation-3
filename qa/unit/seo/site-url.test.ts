import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * `getBaseUrl`/`absoluteUrl` resolve every SEO link. The critical invariant:
 * already-absolute CMS media URLs must pass through untouched (never
 * double-prefixed), while app-relative paths get the canonical origin.
 */
async function loadSite(siteUrl?: string) {
  if (siteUrl !== undefined) vi.stubEnv("NEXT_PUBLIC_SITE_URL", siteUrl)
  return import("@/lib/seo/site")
}

describe("getBaseUrl / absoluteUrl", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("prefers NEXT_PUBLIC_SITE_URL and strips a trailing slash", async () => {
    const { getBaseUrl } = await loadSite("https://momoaudio.com/")
    expect(getBaseUrl()).toBe("https://momoaudio.com")
  })

  it("falls back to localhost when nothing is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    const original = process.env.VERCEL_PROJECT_PRODUCTION_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    const { getBaseUrl } = await import("@/lib/seo/site")
    expect(getBaseUrl()).toBe("http://localhost:3000")
    if (original) process.env.VERCEL_PROJECT_PRODUCTION_URL = original
  })

  it("passes through already-absolute URLs (no double-prefix)", async () => {
    const { absoluteUrl } = await loadSite("https://momoaudio.com")
    expect(absoluteUrl("https://cdn.strapi.io/uploads/x.jpg")).toBe("https://cdn.strapi.io/uploads/x.jpg")
  })

  it("prefixes relative paths and normalizes a missing leading slash", async () => {
    const { absoluteUrl } = await loadSite("https://momoaudio.com")
    expect(absoluteUrl("/products")).toBe("https://momoaudio.com/products")
    expect(absoluteUrl("products")).toBe("https://momoaudio.com/products")
  })
})
