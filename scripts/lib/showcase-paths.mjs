// @ts-check

/**
 * Where a recording is published, as a path under public/showcase/video.
 *
 * One folder per cut or clip, the file named for its format — the same shape
 * features/showcase/lib/domain/asset-paths.ts describes for the public URL, and
 * a unit test keeps the two agreeing.
 */

/** The format a landscape recording is filed under, since it has no suffix in the raw name. */
export const LANDSCAPE = "landscape"

/**
 * Splits a raw recording name into the folder it belongs in and the format it is.
 * `journey-4x5` is the journey clip in 4:5; a bare `storefront` is landscape.
 *
 * @param {string} rawName a raw clip name with no extension
 * @returns {{ group: string, format: string }}
 */
export function videoGroupAndFormat(rawName) {
  const match = /^(.*)-(4x5|9x16)$/.exec(rawName)
  if (match) return { group: match[1].replace(/^cut-/, ""), format: match[2] }
  return { group: rawName.replace(/^cut-/, ""), format: LANDSCAPE }
}

/**
 * @param {string} group
 * @param {string} format
 * @returns {{ dir: string, video: string, poster: string }}
 */
export function publishedVideo(group, format) {
  if (!/^[a-z0-9-]+$/.test(group)) throw new Error(`video group "${group}" must be lowercase letters, digits and hyphens`)
  if (!/^[a-z0-9]+$/.test(format)) throw new Error(`video format "${format}" must be lowercase letters and digits`)
  return { dir: group, video: `${group}/${format}.mp4`, poster: `${group}/${format}.jpg` }
}

/**
 * @param {string} rawName
 * @returns {{ dir: string, video: string, poster: string }}
 */
export function publishedVideoFromRaw(rawName) {
  const { group, format } = videoGroupAndFormat(rawName)
  return publishedVideo(group, format)
}
