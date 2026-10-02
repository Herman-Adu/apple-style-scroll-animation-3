import { vi } from "vitest"
import { assertAdmin, canLockBlocks } from "@/lib/auth/permissions"

export type FakeSession = { email: string; role: "admin" | "customer" } | null

/**
 * Stands in for `@/lib/auth/server`. Only the session is fake: `requireAdmin`
 * and `getServerCanLockBlocks` run the real rules from `lib/auth/permissions`
 * against whatever `session` the test sets.
 */
export function fakeAuth(options: { session?: FakeSession; lockers?: string[] } = {}) {
  const lockers = options.lockers ?? []
  const state = { session: options.session ?? null }

  const module = {
    getServerSession: vi.fn(async () => state.session),
    getServerRole: vi.fn(async () => state.session?.role ?? null),
    requireAdmin: vi.fn(async () => assertAdmin(state.session)),
    getServerCanLockBlocks: vi.fn(async () => canLockBlocks(state.session, lockers)),
  }

  return {
    ...module,
    get session() {
      return state.session
    },
    set session(next: FakeSession) {
      state.session = next
    },
    install: () => vi.doMock("@/lib/auth/server", () => module),
  }
}
