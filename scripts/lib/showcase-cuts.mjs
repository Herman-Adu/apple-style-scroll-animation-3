// @ts-check
import { slugForFormat } from "./showcase-formats.mjs"

/**
 * Audience cuts: short videos stitched from the recorded clips, one per pack.
 * Clip slugs must match qa/showcase/shot-list.ts (a unit test keeps them in sync).
 */
export const CUT_FORMATS = /** @type {const} */ (["4x5", "9x16"])

export const CUTS = Object.freeze([
  { slug: "recruiter", title: "Recruiter cut", clips: ["storefront", "engineering"] },
  {
    slug: "buyer",
    title: "Buyer cut",
    clips: ["storefront", "checkout", "campaigns", "discounts", "orders"],
  },
  { slug: "engineer", title: "Engineer cut", clips: ["engineering", "checkout"] },
])

/** Clips published on their own, to pair with posts on the social calendar. */
export const CALENDAR_CLIPS = Object.freeze(["journey"])

/**
 * @param {string} cutSlug
 * @param {import("./showcase-formats.mjs").ShowcaseFormat} format
 */
export function cutOutputName(cutSlug, format) {
  return `cut-${cutSlug}-${format}`
}

/**
 * @param {readonly string[]} clips
 * @param {import("./showcase-formats.mjs").ShowcaseFormat} format
 * @param {readonly string[]} available raw recording names without extension
 */
export function missingRawClips(clips, format, available) {
  return clips.map((clip) => slugForFormat(clip, format)).filter((name) => !available.includes(name))
}

/** @param {readonly string[]} paths */
export function buildConcatList(paths) {
  if (paths.length === 0) throw new Error("A cut needs at least one clip")
  return paths.map((file) => `file '${file.replaceAll("'", "'\\''")}'\n`).join("")
}

/**
 * @param {{ listFile: string, output: string }} options
 * @returns {string[]}
 */
export function buildConcatArgs({ listFile, output }) {
  if (!output.endsWith(".mp4")) throw new Error("cut output must be an .mp4 file")
  return [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
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
    output,
  ]
}
