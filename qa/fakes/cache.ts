import { vi } from "vitest"

/** Stands in for `next/cache`, recording every revalidation so tests can assert on paths and tags. */
export function fakeCache() {
  const module = {
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
    refresh: vi.fn(),
    cacheTag: vi.fn(),
    cacheLife: vi.fn(),
  }
  return { ...module, install: () => vi.doMock("next/cache", () => module) }
}
