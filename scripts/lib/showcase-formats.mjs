// @ts-check

/**
 * Recording sizes for the showcase clips. Every size is even so H.264 yuv420p
 * can encode it. Portrait formats are recorded at their own viewport, so the
 * site's responsive layout is what ends up on camera.
 *
 * @typedef {"landscape" | "4x5" | "9x16"} ShowcaseFormat
 */

/** @type {Record<ShowcaseFormat, { width: number, height: number }>} */
export const SHOWCASE_FORMATS = {
  landscape: { width: 1280, height: 720 },
  "4x5": { width: 768, height: 960 },
  "9x16": { width: 540, height: 960 },
}

/**
 * @param {string | undefined} value
 * @returns {ShowcaseFormat}
 */
export function formatFromEnv(value) {
  if (value === undefined || value === "") return "landscape"
  if (value in SHOWCASE_FORMATS) return /** @type {ShowcaseFormat} */ (value)
  throw new Error(`Unknown showcase format "${value}". Use one of: ${Object.keys(SHOWCASE_FORMATS).join(", ")}`)
}

/**
 * @param {string} slug
 * @param {ShowcaseFormat} format
 * @returns {string}
 */
export function slugForFormat(slug, format) {
  return format === "landscape" ? slug : `${slug}-${format}`
}
