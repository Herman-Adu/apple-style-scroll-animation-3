import { vi } from "vitest"
import type { SendEmailInput, SendEmailResult } from "@/features/email/lib/sending/provider"

/** Stands in for `@/features/email/provider`: sent mail lands in `outbox`; `failNext()` makes the next send fail. */
export function fakeEmail() {
  const outbox: SendEmailInput[] = []
  const state: { failure: string | null } = { failure: null }

  const sendEmail = vi.fn(async (input: SendEmailInput): Promise<SendEmailResult> => {
    if (state.failure !== null) {
      const error = state.failure
      state.failure = null
      return { ok: false, error }
    }
    outbox.push(input)
    return { ok: true, id: `fake_${outbox.length}` }
  })
  const module = { sendEmail, isEmailConfigured: () => true }

  return {
    outbox,
    sendEmail,
    failNext: (error = "fake send failure") => {
      state.failure = error
    },
    install: () => vi.doMock("@/features/email/lib/sending/provider", () => module),
  }
}
