// @ts-check

/**
 * Pure ffmpeg argument builders for the showcase video pipeline.
 * Kept free of I/O so they are unit-tested in qa/unit/showcase.
 */

const CLIP_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** @param {string} value @param {string} label */
function requirePath(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} path is required`)
  }
}

/**
 * @param {{ input: string, output: string }} options
 * @returns {string[]}
 */
export function buildTranscodeArgs({ input, output }) {
  requirePath(input, "input")
  requirePath(output, "output")
  if (!input.endsWith(".webm")) throw new Error("input must be a .webm recording")
  if (!output.endsWith(".mp4")) throw new Error("output must be an .mp4 file")

  return [
    "-y",
    "-i",
    input,
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

/**
 * @param {{ input: string, output: string, atSeconds?: number }} options
 * @returns {string[]}
 */
export function buildPosterArgs({ input, output, atSeconds = 1 }) {
  requirePath(input, "input")
  requirePath(output, "output")
  if (!output.endsWith(".jpg")) throw new Error("poster output must be a .jpg file")
  if (!Number.isFinite(atSeconds) || atSeconds < 0) {
    throw new Error("atSeconds must be a finite number of seconds, 0 or more")
  }

  return ["-y", "-ss", String(atSeconds), "-i", input, "-frames:v", "1", "-q:v", "3", output]
}

/**
 * @param {string} slug
 * @returns {{ video: string, poster: string }}
 */
export function clipFileNames(slug) {
  if (!CLIP_SLUG.test(slug)) {
    throw new Error(`clip slug "${slug}" must be lowercase letters, digits and hyphens`)
  }
  return { video: `${slug}.mp4`, poster: `${slug}.jpg` }
}
