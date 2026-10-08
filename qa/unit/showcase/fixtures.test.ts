import { describe, expect, it } from "vitest"
import { DEV_CHROME_SELECTORS, recordingStyle } from "../../showcase/fixtures"

describe("recordingStyle", () => {
  it("hides the dev tools overlay, which is not part of the product", () => {
    expect(DEV_CHROME_SELECTORS).toContain("nextjs-portal")
    for (const selector of DEV_CHROME_SELECTORS) expect(recordingStyle()).toContain(selector)
    expect(recordingStyle()).toContain("display:none!important")
  })

  it("turns off smooth scrolling, which made one programmatic scroll take sixteen seconds", () => {
    // scroll-behavior applies to scrollIntoView and scrollTo, so Playwright
    // crawls the whole height of a 500vh hero and records a frozen frame.
    expect(recordingStyle()).toContain("scroll-behavior:auto!important")
  })
})
