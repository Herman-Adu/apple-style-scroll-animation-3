/**
 * Where every published showcase asset lives.
 *
 * One folder per audience or topic, holding everything for it: the carousel, the
 * images, the video. Picking assets for a post means opening one folder, not
 * filtering sixty-seven files by prefix. Everything new follows the same shape,
 * and `qa/unit/showcase/asset-layout.test.ts` fails if something lands outside it.
 */

export const SHOWCASE_ROOT = "/showcase"

/** An audience or a topic. One folder each, under both `social/` and `video/`. */
export const ASSET_GROUPS = [
  "buyer",
  "engineer",
  "recruiter",
  "security",
  "how-it-was-built",
  "checkout-sequence",
  "site-tour",
  "email-case-study",
  "shared",
] as const

export type AssetGroup = (typeof ASSET_GROUPS)[number]

/**
 * The social asset id a slide is rendered from, mapped to the folder it belongs
 * in and the name it takes there. Ids stay as they are: they address a React
 * component, not a file.
 */
const SOCIAL_PREFIXES: { prefix: string; group: AssetGroup }[] = [
  { prefix: "infographic-buyer-", group: "buyer" },
  { prefix: "infographic-engineer-", group: "engineer" },
  { prefix: "infographic-recruiter-", group: "recruiter" },
  { prefix: "recruiter-", group: "recruiter" },
  { prefix: "security-", group: "security" },
  { prefix: "build-", group: "how-it-was-built" },
  { prefix: "sequence-checkout-", group: "checkout-sequence" },
  { prefix: "tour-", group: "site-tour" },
  { prefix: "carousel-", group: "email-case-study" },
]

/** Squares sit together: they are one format, not one subject. */
const SQUARE_PREFIX = "square-"

/** Where a social asset is published, as a public URL. */
export function socialAssetPath(id: string): string {
  if (id.startsWith(SQUARE_PREFIX)) {
    return `${SHOWCASE_ROOT}/social/shared/squares/${id.slice(SQUARE_PREFIX.length)}.png`
  }
  const match = SOCIAL_PREFIXES.find((candidate) => id.startsWith(candidate.prefix))
  if (!match) return `${SHOWCASE_ROOT}/social/shared/${id.replace(/^infographic-/, "")}.png`
  return `${SHOWCASE_ROOT}/social/${match.group}/${id.slice(match.prefix.length)}.png`
}

/** A group's folder, for channels that post its images rather than its PDF. */
export function socialGroupPath(group: AssetGroup): string {
  return `${SHOWCASE_ROOT}/social/${group}`
}

/** Every carousel is its group's `carousel.pdf`, so one folder holds one swipeable post. */
export function carouselPdfPath(group: AssetGroup): string {
  return `${SHOWCASE_ROOT}/social/${group}/carousel.pdf`
}

/** Stills cut from a recording, used as slide artwork. */
export function tourStillPath(name: string): string {
  return `${SHOWCASE_ROOT}/social/site-tour/stills/${name}.jpg`
}

/**
 * Where a video is published. Cuts and clips share the shape: the folder names
 * the thing, the file names the format.
 */
export function videoPath(group: string, format: string, extension: "mp4" | "jpg"): string {
  return `${SHOWCASE_ROOT}/video/${group}/${format}.${extension}`
}
