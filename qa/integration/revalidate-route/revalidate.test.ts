import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The publish webhook is a security boundary as much as a cache tool: it must
 * stay inert until configured, reject a wrong secret, and bust only the tags
 * mapped to the published model. `revalidateTag` is mocked — we assert which
 * tags it is called with, not Next's cache internals.
 */
const revalidateTag = vi.fn()
vi.mock("next/cache", () => ({ revalidateTag: (tag: string) => revalidateTag(tag) }))

const postRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })

async function loadRoute(secret?: string) {
  if (secret !== undefined) vi.stubEnv("STRAPI_WEBHOOK_SECRET", secret)
  return import("@/app/api/revalidate/route")
}

describe("POST /api/revalidate", () => {
  beforeEach(() => revalidateTag.mockClear())
  afterEach(() => vi.restoreAllMocks())

  it("is inert (501) until the webhook secret is configured", async () => {
    const { POST } = await loadRoute("")
    const res = await POST(postRequest({ model: "product" }))
    expect(res.status).toBe(501)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("rejects a wrong secret with 401", async () => {
    const { POST } = await loadRoute("right-secret")
    const res = await POST(postRequest({ model: "product" }, { authorization: "Bearer wrong" }))
    expect(res.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it("400s when the model is missing", async () => {
    const { POST } = await loadRoute("s3cret")
    const res = await POST(postRequest({ entry: { slug: "x" } }, { authorization: "Bearer s3cret" }))
    expect(res.status).toBe(400)
  })

  it("busts collection + detail tags for a published product", async () => {
    const { POST } = await loadRoute("s3cret")
    const res = await POST(
      postRequest({ model: "product", entry: { slug: "momo-x" } }, { authorization: "Bearer s3cret" }),
    )
    const json = (await res.json()) as { revalidated: boolean; tags: string[] }

    expect(res.status).toBe(200)
    expect(json.revalidated).toBe(true)
    expect(json.tags).toEqual(expect.arrayContaining(["products", "product:momo-x"]))
    expect(revalidateTag).toHaveBeenCalledWith("products")
    expect(revalidateTag).toHaveBeenCalledWith("product:momo-x")
  })

  it("200s but no-ops for an unmapped model", async () => {
    const { POST } = await loadRoute("s3cret")
    const res = await POST(postRequest({ model: "unknown" }, { authorization: "Bearer s3cret" }))
    expect(res.status).toBe(200)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
