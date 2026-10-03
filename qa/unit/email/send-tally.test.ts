import { describe, expect, it } from "vitest"
import { tallySendResults } from "@/features/email/lib/sending/send-tally"

describe("tallySendResults", () => {
  it("counts sent, skipped and failed results", () => {
    const providerResults = [
      { ok: true as const, id: "a" },
      { ok: true as const, id: null, skipped: true },
      { ok: false as const, error: "boom" },
      { ok: true as const, id: "b" },
    ]
    expect(tallySendResults(providerResults)).toEqual({ sent: 2, skipped: 1, failed: 1 })
  })

  it("returns zeros for no results", () => {
    expect(tallySendResults([])).toEqual({ sent: 0, skipped: 0, failed: 0 })
  })
})
