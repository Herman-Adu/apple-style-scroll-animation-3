import { vi } from "vitest"

type Handler = (request: Request) => Response | Promise<Response>

/**
 * Stands in for `fetch` to one outside API (e.g. a CMS later). Scripted routes
 * answer; unknown paths 404; any other host throws so a test can't silently hit
 * the network. Call `install()` inside the test or a `beforeEach`, because the
 * global setup unstubs globals before every test.
 */
export function fakeHttp(baseUrl: string) {
  const origin = new URL(baseUrl).origin
  const routes = new Map<string, Handler>()
  const requests: Request[] = []

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    if (url.origin !== origin) throw new Error(`fakeHttp: unexpected request to ${request.url}`)
    requests.push(request)
    const handler = routes.get(`${request.method} ${url.pathname}`)
    return handler ? handler(request) : new Response("Not found", { status: 404 })
  })

  const api = {
    requests,
    fetch,
    on: (method: string, pathname: string, handler: Handler) => {
      routes.set(`${method.toUpperCase()} ${pathname}`, handler)
      return api
    },
    install: () => vi.stubGlobal("fetch", fetch),
  }
  return api
}
