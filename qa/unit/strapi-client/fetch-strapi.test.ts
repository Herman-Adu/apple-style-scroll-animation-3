import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * Locks the resilience behavior of the single hardened transport: envelope
 * unwrapping, 4xx fail-fast, 5xx + network retry, and timeout mapping.
 *
 * `env` reads `process.env` at module load, and the client reads `env` at call
 * time, so each test stubs `STRAPI_API_URL` then dynamically imports the client
 * against a fresh module registry (reset in the global setup).
 */
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })

async function loadClient() {
  vi.stubEnv("STRAPI_API_URL", "https://cms.test/api/")
  vi.stubEnv("STRAPI_API_TOKEN", "test-token")
  return import("@/lib/strapi/client")
}

describe("fetchStrapi", () => {
  beforeEach(() => vi.useRealTimers())
  afterEach(() => vi.restoreAllMocks())

  it("unwraps the { data } envelope and passes it to parse", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{ slug: "a" }], meta: {} }))
    vi.stubGlobal("fetch", fetchMock)

    const { fetchStrapi } = await loadClient()
    const result = await fetchStrapi("/products", { parse: (d) => d })

    expect(result).toEqual([{ slug: "a" }])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe("Bearer test-token")
  })

  it("fails fast on a 4xx without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "nope" }, 404))
    vi.stubGlobal("fetch", fetchMock)

    const { fetchStrapi, StrapiError } = await loadClient()
    await expect(fetchStrapi("/products", { parse: (d) => d, retries: 2 })).rejects.toBeInstanceOf(StrapiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries a 5xx up to the retry budget then throws", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ error: "boom" }, 503))
    vi.stubGlobal("fetch", fetchMock)

    const { fetchStrapi, StrapiError } = await loadClient()
    await expect(fetchStrapi("/products", { parse: (d) => d, retries: 1 })).rejects.toBeInstanceOf(StrapiError)
    // initial attempt + 1 retry
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("maps an aborted request to a timeout StrapiError", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" })
    const fetchMock = vi.fn().mockRejectedValue(abortErr)
    vi.stubGlobal("fetch", fetchMock)

    const { fetchStrapi, StrapiError } = await loadClient()
    await expect(fetchStrapi("/products", { parse: (d) => d, retries: 0 })).rejects.toThrow(StrapiError)
  })

  it("throws when STRAPI_API_URL is not configured", async () => {
    vi.stubEnv("STRAPI_API_URL", "")
    const { fetchStrapi } = await import("@/lib/strapi/client")
    await expect(fetchStrapi("/products", { parse: (d) => d })).rejects.toThrow(/not configured/i)
  })
})

describe("toEntries", () => {
  it("normalizes arrays, singles, and null into an array", async () => {
    const { toEntries } = await loadClient()
    expect(toEntries([1, 2])).toEqual([1, 2])
    expect(toEntries({ a: 1 })).toEqual([{ a: 1 }])
    expect(toEntries(null)).toEqual([])
  })
})
