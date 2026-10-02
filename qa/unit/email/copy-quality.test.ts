import { describe, expect, it } from "vitest"
import {
  PREVIEW_SOFT_LIMIT,
  SUBJECT_SOFT_LIMIT,
  charCountTone,
  findSpamFlags,
} from "@/features/email/copy-quality"

describe("findSpamFlags", () => {
  it("returns nothing for a clean subject", () => {
    expect(findSpamFlags("Your order is on its way")).toEqual([])
  })

  it("flags common spam-trigger phrases case-insensitively", () => {
    const labels = findSpamFlags("Act now: free shipping, limited time").map((f) => f.label.toLowerCase())
    expect(labels).toEqual(expect.arrayContaining(["act now", "free", "limited time"]))
  })

  it("flags shouting (ALL-CAPS words of 4+ letters) and stacked exclamation marks", () => {
    const labels = findSpamFlags("HUGE savings!!!").map((f) => f.label)
    expect(labels).toContain("HUGE")
    expect(labels).toContain("!!!")
  })

  it("does not flag short acronyms or words that merely contain a trigger", () => {
    expect(findSpamFlags("New EU hours")).toEqual([])
    expect(findSpamFlags("Freedom to listen")).toEqual([])
  })
})

describe("charCountTone", () => {
  it("is ok at or under the limit", () => {
    expect(charCountTone(0, SUBJECT_SOFT_LIMIT)).toBe("ok")
    expect(charCountTone(SUBJECT_SOFT_LIMIT, SUBJECT_SOFT_LIMIT)).toBe("ok")
  })

  it("warns just past the limit and goes over beyond 15% slack", () => {
    expect(charCountTone(SUBJECT_SOFT_LIMIT + 1, SUBJECT_SOFT_LIMIT)).toBe("warn")
    expect(charCountTone(Math.ceil(PREVIEW_SOFT_LIMIT * 1.15) + 1, PREVIEW_SOFT_LIMIT)).toBe("over")
  })
})
