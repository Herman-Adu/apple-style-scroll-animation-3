import { describe, expect, it } from "vitest"
import {
  buildPosterArgs,
  buildTranscodeArgs,
  clipFileNames,
} from "../../../scripts/lib/video-args.mjs"

describe("buildTranscodeArgs", () => {
  it("converts webm to a web-safe H.264 mp4 with no audio and fast start", () => {
    expect(buildTranscodeArgs({ input: "in/a.webm", output: "out/a.mp4" })).toEqual([
      "-y",
      "-i",
      "in/a.webm",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      "out/a.mp4",
    ])
  })

  it("rejects a non-webm input", () => {
    expect(() => buildTranscodeArgs({ input: "a.mp4", output: "b.mp4" })).toThrow(/webm/)
  })

  it("rejects a non-mp4 output", () => {
    expect(() => buildTranscodeArgs({ input: "a.webm", output: "b.mov" })).toThrow(/mp4/)
  })

  it("rejects empty paths", () => {
    expect(() => buildTranscodeArgs({ input: "", output: "b.mp4" })).toThrow()
  })
})

describe("buildPosterArgs", () => {
  it("grabs one frame at the given second as a jpg", () => {
    expect(buildPosterArgs({ input: "a.webm", output: "a.jpg", atSeconds: 2 })).toEqual([
      "-y",
      "-ss",
      "2",
      "-i",
      "a.webm",
      "-frames:v",
      "1",
      "-q:v",
      "3",
      "a.jpg",
    ])
  })

  it("defaults to one second in", () => {
    expect(buildPosterArgs({ input: "a.webm", output: "a.jpg" })).toContain("1")
  })

  it("rejects negative or non-finite seek times", () => {
    expect(() => buildPosterArgs({ input: "a.webm", output: "a.jpg", atSeconds: -1 })).toThrow()
    expect(() =>
      buildPosterArgs({ input: "a.webm", output: "a.jpg", atSeconds: Number.NaN }),
    ).toThrow()
  })

  it("rejects a non-jpg output", () => {
    expect(() => buildPosterArgs({ input: "a.webm", output: "a.png" })).toThrow(/jpg/)
  })
})

describe("clipFileNames", () => {
  it("derives the mp4 and poster names from a clip slug", () => {
    expect(clipFileNames("storefront")).toEqual({
      video: "storefront.mp4",
      poster: "storefront.jpg",
    })
  })

  it("rejects slugs that could escape the output folder", () => {
    expect(() => clipFileNames("../evil")).toThrow()
    expect(() => clipFileNames("Has Spaces")).toThrow()
  })
})
