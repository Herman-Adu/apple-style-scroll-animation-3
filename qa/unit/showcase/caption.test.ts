import { describe, expect, it } from "vitest"
import { CAPTION_ELEMENT_ID, MAX_CAPTION_LENGTH, buildCaptionHtml } from "../../showcase/caption"

describe("buildCaptionHtml", () => {
  it("renders the text inside a fixed, bottom-anchored overlay with a stable id", () => {
    const html = buildCaptionHtml("Add a discount code at checkout")
    expect(html).toContain(`id="${CAPTION_ELEMENT_ID}"`)
    expect(html).toContain("Add a discount code at checkout")
    expect(html).toContain("position:fixed")
    expect(html).toContain("bottom:")
  })

  it("never lets caption text inject markup into the page", () => {
    const html = buildCaptionHtml(`<img src=x onerror="alert(1)"> & more`)
    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;img")
    expect(html).toContain("&amp; more")
  })

  it("does not block clicks or pointer movement while recording", () => {
    expect(buildCaptionHtml("Hello")).toContain("pointer-events:none")
  })

  it("rejects empty captions", () => {
    expect(() => buildCaptionHtml("   ")).toThrow(/empty/)
  })

  it("rejects captions too long to read in a few seconds", () => {
    expect(() => buildCaptionHtml("x".repeat(MAX_CAPTION_LENGTH + 1))).toThrow(/long/)
  })
})
