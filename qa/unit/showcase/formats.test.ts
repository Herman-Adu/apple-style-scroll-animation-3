import { describe, expect, it } from "vitest"
import {
  SHOWCASE_FORMATS,
  formatFromEnv,
  slugForFormat,
} from "../../../scripts/lib/showcase-formats.mjs"

describe("SHOWCASE_FORMATS", () => {
  it("keeps the landscape recording at 1280x720", () => {
    expect(SHOWCASE_FORMATS.landscape).toEqual({ width: 1280, height: 720 })
  })

  it("records 4:5 for LinkedIn and 9:16 for Telegram and Stories", () => {
    const { width: w45, height: h45 } = SHOWCASE_FORMATS["4x5"]
    const { width: w916, height: h916 } = SHOWCASE_FORMATS["9x16"]
    expect(w45 / h45).toBeCloseTo(4 / 5, 5)
    expect(w916 / h916).toBeCloseTo(9 / 16, 5)
  })

  it("uses even dimensions so H.264 yuv420p can encode every format", () => {
    for (const { width, height } of Object.values(SHOWCASE_FORMATS)) {
      expect(width % 2).toBe(0)
      expect(height % 2).toBe(0)
    }
  })
})

describe("formatFromEnv", () => {
  it("defaults to landscape when nothing is set", () => {
    expect(formatFromEnv(undefined)).toBe("landscape")
    expect(formatFromEnv("")).toBe("landscape")
  })

  it("accepts the known format names", () => {
    expect(formatFromEnv("4x5")).toBe("4x5")
    expect(formatFromEnv("9x16")).toBe("9x16")
  })

  it("fails loudly on an unknown format instead of recording the wrong size", () => {
    expect(() => formatFromEnv("16x9")).toThrow(/4x5/)
  })
})

describe("slugForFormat", () => {
  it("keeps the plain slug for landscape", () => {
    expect(slugForFormat("storefront", "landscape")).toBe("storefront")
  })

  it("suffixes the slug for portrait formats so files never collide", () => {
    expect(slugForFormat("storefront", "4x5")).toBe("storefront-4x5")
    expect(slugForFormat("checkout", "9x16")).toBe("checkout-9x16")
  })
})
