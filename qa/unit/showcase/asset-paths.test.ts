import { describe, expect, it } from "vitest"
import {
  ASSET_GROUPS,
  carouselPdfPath,
  socialAssetPath,
  tourStillPath,
  videoPath,
} from "@/features/showcase/lib/domain/asset-paths"

describe("socialAssetPath", () => {
  it.each([
    ["infographic-buyer-cost-line", "/showcase/social/buyer/cost-line.png"],
    ["infographic-engineer-coverage", "/showcase/social/engineer/coverage.png"],
    ["infographic-recruiter-proof", "/showcase/social/recruiter/proof.png"],
    ["recruiter-cta", "/showcase/social/recruiter/cta.png"],
    ["security-cover", "/showcase/social/security/cover.png"],
    ["security-3", "/showcase/social/security/3.png"],
    ["build-cover", "/showcase/social/how-it-was-built/cover.png"],
    ["sequence-checkout-2", "/showcase/social/checkout-sequence/2.png"],
    ["tour-analytics", "/showcase/social/site-tour/analytics.png"],
    ["carousel-flow", "/showcase/social/email-case-study/flow.png"],
  ])("puts %s in its own group's folder", (id, expected) => {
    expect(socialAssetPath(id)).toBe(expected)
  })

  it("keeps the squares together, because a square is a format and not a subject", () => {
    expect(socialAssetPath("square-layers")).toBe("/showcase/social/shared/squares/layers.png")
  })

  it("drops anything that belongs to no audience into shared, without its prefix", () => {
    expect(socialAssetPath("infographic-stack")).toBe("/showcase/social/shared/stack.png")
    expect(socialAssetPath("infographic-line-chart")).toBe("/showcase/social/shared/line-chart.png")
  })

  it("gives every asset a path inside a known group", () => {
    const ids = ["infographic-buyer-cost-line", "security-1", "tour-products", "infographic-table", "square-locks"]
    for (const id of ids) {
      const [, , , group] = socialAssetPath(id).split("/")
      expect(ASSET_GROUPS, `${id} -> ${group}`).toContain(group)
    }
  })
})

describe("carouselPdfPath", () => {
  it("names every carousel the same inside its own folder", () => {
    expect(carouselPdfPath("buyer")).toBe("/showcase/social/buyer/carousel.pdf")
    expect(carouselPdfPath("email-case-study")).toBe("/showcase/social/email-case-study/carousel.pdf")
  })

  it("covers every group without collision", () => {
    const paths = ASSET_GROUPS.map(carouselPdfPath)
    expect(new Set(paths).size).toBe(paths.length)
  })
})

describe("videoPath", () => {
  it("names the folder for the thing and the file for the format", () => {
    expect(videoPath("buyer", "9x16", "mp4")).toBe("/showcase/video/buyer/9x16.mp4")
    expect(videoPath("restock", "4x5", "jpg")).toBe("/showcase/video/restock/4x5.jpg")
    expect(videoPath("storefront", "landscape", "mp4")).toBe("/showcase/video/storefront/landscape.mp4")
  })
})

describe("tourStillPath", () => {
  it("keeps the stills beside the carousel they illustrate", () => {
    expect(tourStillPath("checkout")).toBe("/showcase/social/site-tour/stills/checkout.jpg")
  })
})
