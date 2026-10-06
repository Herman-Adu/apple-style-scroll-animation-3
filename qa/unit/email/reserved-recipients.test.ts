import { describe, expect, it } from "vitest"
import { deliverableRecipients, isReservedEmail } from "@/features/email/lib/domain/reserved-recipients"

describe("reserved recipients", () => {
  it.each(["ava@demo.momo-audio.test", "x@example", "y@foo.invalid", "z@app.localhost", "CAPS@SHOUT.TEST"])(
    "never delivers to the reserved test domain in %s",
    (address) => {
      expect(isReservedEmail(address)).toBe(true)
    },
  )

  it.each(["someone@gmail.com", "owner@momo-audio.co.uk", "a@tested.com", "b@test.io"])("delivers to %s", (address) => {
    expect(isReservedEmail(address)).toBe(false)
  })

  it("drops only the reserved addresses from a mixed list", () => {
    expect(deliverableRecipients(["a@demo.momo-audio.test", "real@gmail.com"])).toEqual(["real@gmail.com"])
    expect(deliverableRecipients("only@demo.momo-audio.test")).toEqual([])
  })
})
