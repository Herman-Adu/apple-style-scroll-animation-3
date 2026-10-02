import { vi } from "vitest"

/**
 * Stands in for `@/lib/db/prisma`. The test supplies only the models (and raw
 * helpers like `$executeRaw`) the code under test touches; the fake adds a
 * `$transaction` that handles both Prisma forms — an array of promises, or a
 * callback that receives the same fake client as `tx`.
 */
export function fakeDb<M extends Record<string, unknown>>(models: M) {
  type Client = M & { $transaction: typeof $transaction }
  const $transaction = vi.fn(async <T>(arg: Promise<T>[] | ((tx: Client) => T | Promise<T>)) =>
    typeof arg === "function" ? arg(prisma) : Promise.all(arg),
  )
  const prisma = { ...models, $transaction } as Client

  return {
    prisma,
    /** Registers the fake for later `await import(...)` calls in this test file. */
    install: () => vi.doMock("@/lib/db/prisma", () => ({ prisma })),
  }
}
