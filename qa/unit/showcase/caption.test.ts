import { describe, expect, it } from "vitest"
import {
  CAPTION_BAND_RATIO,
  CAPTION_ELEMENT_ID,
  HEADLINE_MIN_PX,
  MAX_CAPTION_LENGTH,
  buildCaptionHtml,
  HEADLINE_CLEAR_SHARE,
  captionPlacement,
} from "../../showcase/caption"

const band = (headline: number, items = 0) => ({ headline, items })

describe("captionPlacement", () => {
  it("sits at the top when nothing headline-sized is up there", () => {
    expect(captionPlacement(band(0), band(0))).toBe("top")
    expect(captionPlacement(band(0), band(0.4))).toBe("top")
  })

  it("drops to the bottom when a page title or product name is at the top", () => {
    expect(captionPlacement(band(0.4), band(0))).toBe("bottom")
  })

  it("takes the lesser of two busy bands", () => {
    expect(captionPlacement(band(0.2), band(0.5))).toBe("top")
    expect(captionPlacement(band(0.5), band(0.2))).toBe("bottom")
  })

  it("prefers empty space when neither band has a headline", () => {
    // An admin list ends mid-page: the bottom of the screen is blank, the top
    // carries a search box and a toolbar.
    expect(captionPlacement(band(0, 6), band(0, 0))).toBe("bottom")
    expect(captionPlacement(band(0, 1), band(0, 4))).toBe("top")
  })

  it("ignores a sliver of large text rather than moving the caption across the screen", () => {
    expect(captionPlacement(band(HEADLINE_CLEAR_SHARE), band(0.9))).toBe("top")
    expect(HEADLINE_CLEAR_SHARE).toBeLessThan(0.01)
  })

  it("measures a band big enough to hold a caption but not most of the screen", () => {
    expect(CAPTION_BAND_RATIO).toBeGreaterThan(0.15)
    expect(CAPTION_BAND_RATIO).toBeLessThan(0.35)
  })

  it("counts only text large enough to be a headline", () => {
    expect(HEADLINE_MIN_PX).toBeGreaterThanOrEqual(20)
  })
})

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

  it("anchors to the top when asked, so a caption can clear a product name", () => {
    const html = buildCaptionHtml("Sold out?", "top")
    expect(html).toContain("top:")
    expect(html).not.toContain("bottom:")
  })

  it("rejects empty captions", () => {
    expect(() => buildCaptionHtml("   ")).toThrow(/empty/)
  })

  it("rejects captions too long to read in a few seconds", () => {
    expect(() => buildCaptionHtml("x".repeat(MAX_CAPTION_LENGTH + 1))).toThrow(/long/)
  })
})
