import { describe, expect, it } from "vitest"
import { uniqueSlug } from "@/features/catalog/lib/domain/store"
import type { ProductMap } from "@/features/catalog/lib/domain/store"

const taken = (...slugs: string[]) => Object.fromEntries(slugs.map((s) => [s, {}])) as unknown as ProductMap

describe("uniqueSlug", () => {
  it("returns the base when it is free", () => {
    expect(uniqueSlug("speaker", taken())).toBe("speaker")
  })

  it("suffixes -2, -3 until free", () => {
    expect(uniqueSlug("speaker", taken("speaker"))).toBe("speaker-2")
    expect(uniqueSlug("speaker", taken("speaker", "speaker-2", "speaker-3"))).toBe("speaker-4")
  })

  it("falls back to 'product' for an empty base", () => {
    expect(uniqueSlug("", taken())).toBe("product")
  })
})
