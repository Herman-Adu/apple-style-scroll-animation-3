import { describe, expect, it } from "vitest"
import {
  CALENDAR_CLIPS,
  CUTS,
  CUT_FORMATS,
  buildConcatArgs,
  buildConcatList,
  cutOutputName,
  missingRawClips,
} from "../../../scripts/lib/showcase-cuts.mjs"
import { clipFileNames } from "../../../scripts/lib/video-args.mjs"
import { CLIPS, DEFERRED_CLIPS } from "../../showcase/shot-list"

const clipSlugs = CLIPS.map((clip) => clip.slug)
const audienceOf = (slug: string) => CLIPS.find((clip) => clip.slug === slug)?.audience

describe("showcase audience cuts", () => {
  it("plans the recruiter, buyer and engineer cuts in that order", () => {
    expect(CUTS.map((cut) => cut.slug)).toEqual(["recruiter", "buyer", "engineer"])
  })

  it("builds every cut only from clips that are on the shot list, with no repeats", () => {
    for (const cut of CUTS) {
      expect(cut.clips.length, cut.slug).toBeGreaterThanOrEqual(2)
      expect(new Set(cut.clips).size, cut.slug).toBe(cut.clips.length)
      for (const clip of cut.clips) expect(clipSlugs, `${cut.slug} uses ${clip}`).toContain(clip)
    }
  })

  it("keeps client-only admin clips out of the recruiter cut", () => {
    const recruiter = CUTS.find((cut) => cut.slug === "recruiter")!
    for (const clip of recruiter.clips) expect(audienceOf(clip), clip).not.toBe("client")
    expect(recruiter.clips).toContain("engineering")
  })

  it("opens the buyer cut on the storefront and shows checkout and the admin", () => {
    const buyer = CUTS.find((cut) => cut.slug === "buyer")!
    expect(buyer.clips[0]).toBe("storefront")
    expect(buyer.clips).toContain("checkout")
    expect(buyer.clips).toContain("campaigns")
  })

  it("leads the engineer cut with the engineering proof and an end-to-end flow", () => {
    const engineer = CUTS.find((cut) => cut.slug === "engineer")!
    expect(engineer.clips[0]).toBe("engineering")
    expect(engineer.clips).toContain("checkout")
  })

  it("never uses a deferred clip in a cut or on the calendar", () => {
    const deferred = DEFERRED_CLIPS.map((clip) => clip.slug)
    for (const cut of CUTS) for (const clip of cut.clips) expect(deferred, `${cut.slug} uses ${clip}`).not.toContain(clip)
    for (const clip of CALENDAR_CLIPS) expect(deferred, clip).not.toContain(clip)
  })

  it("renders cuts in the two social formats only", () => {
    expect(CUT_FORMATS).toEqual(["4x5", "9x16"])
  })

  it("publishes the journey clip on its own for the calendar", () => {
    expect(CALENDAR_CLIPS).toEqual(["journey"])
    for (const clip of CALENDAR_CLIPS) expect(clipSlugs).toContain(clip)
  })

  it("names cut files so the video file-name rules accept them", () => {
    expect(cutOutputName("buyer", "9x16")).toBe("cut-buyer-9x16")
    expect(cutOutputName("recruiter", "4x5")).toBe("cut-recruiter-4x5")
    for (const cut of CUTS) {
      for (const format of CUT_FORMATS) expect(() => clipFileNames(cutOutputName(cut.slug, format))).not.toThrow()
    }
  })

  it("lists the raw recordings a cut still needs for a format", () => {
    const available = ["storefront-4x5", "engineering-4x5", "storefront-9x16"]
    expect(missingRawClips(["storefront", "engineering"], "4x5", available)).toEqual([])
    expect(missingRawClips(["storefront", "engineering"], "9x16", available)).toEqual(["engineering-9x16"])
  })
})

describe("concat helpers", () => {
  it("writes an ffmpeg concat list, one quoted file per line", () => {
    expect(buildConcatList(["/raw/a.webm", "/raw/b.webm"])).toBe("file '/raw/a.webm'\nfile '/raw/b.webm'\n")
  })

  it("escapes single quotes in paths", () => {
    expect(buildConcatList(["/raw/it's.webm"])).toBe("file '/raw/it'\\''s.webm'\n")
  })

  it("refuses an empty list", () => {
    expect(() => buildConcatList([])).toThrow(/at least one/i)
  })

  it("re-encodes the joined clips to a web-ready H.264 mp4", () => {
    const args = buildConcatArgs({ listFile: "/tmp/list.txt", output: "/out/cut-buyer-4x5.mp4" })
    expect(args.slice(0, 7)).toEqual(["-y", "-f", "concat", "-safe", "0", "-i", "/tmp/list.txt"])
    expect(args).toContain("libx264")
    expect(args).toContain("yuv420p")
    expect(args).toContain("+faststart")
    expect(args).toContain("-an")
    expect(args.at(-1)).toBe("/out/cut-buyer-4x5.mp4")
  })

  it("rejects an output that is not an mp4", () => {
    expect(() => buildConcatArgs({ listFile: "/tmp/list.txt", output: "/out/cut.webm" })).toThrow(/mp4/)
  })
})
