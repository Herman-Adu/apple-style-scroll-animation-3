export const CAPTION_ELEMENT_ID = "showcase-caption"

/** Short enough to read in two or three seconds on a muted phone feed. */
export const MAX_CAPTION_LENGTH = 90

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/** Where a caption sits. Measured per shot, so it never lands on a headline. */
export type CaptionPlacement = "top" | "bottom"

/** The share of the viewport each caption band occupies. */
export const CAPTION_BAND_RATIO = 0.26

/** Text this size or larger is a headline — a product name, a page title. */
export const HEADLINE_MIN_PX = 24

/**
 * A band counts as clear below this share of its area. It is a sliver, not a
 * label: an admin stat like a revenue figure covers about 3% of a band, and a
 * caption dropped on that reads exactly as badly as one dropped on a title.
 */
export const HEADLINE_CLEAR_SHARE = 0.005

/** What a caption band would cover. */
export interface BandCover {
  /** Share of the band's area under headline-sized text. */
  headline: number
  /** How many separate pieces of text the band covers, headline or not. */
  items: number
}

/**
 * A caption never sits on a headline — a product name, a page title, a revenue
 * figure. When neither band has one it takes whichever covers fewer separate
 * things, which puts it over empty space rather than over a toolbar. Ties go to
 * the top, where site chrome is slim and page copy usually sits lower.
 */
export function captionPlacement(top: BandCover, bottom: BandCover): CaptionPlacement {
  const topClear = top.headline <= HEADLINE_CLEAR_SHARE
  const bottomClear = bottom.headline <= HEADLINE_CLEAR_SHARE
  if (topClear !== bottomClear) return topClear ? "top" : "bottom"
  if (topClear) return top.items <= bottom.items ? "top" : "bottom"
  return top.headline < bottom.headline ? "top" : "bottom"
}

const CAPTION_STYLE = [
  "position:fixed",
  "left:50%",
  "transform:translateX(-50%)",
  "max-width:86%",
  "padding:14px 26px",
  "border-radius:14px",
  "background:rgba(10,12,16,0.86)",
  "color:#f5f7fa",
  "font:600 28px/1.35 system-ui,-apple-system,Segoe UI,sans-serif",
  "text-align:center",
  "text-wrap:balance",
  "z-index:2147483647",
  "pointer-events:none",
].join(";")

/** Markup for the burned-in caption. It is recorded with the page, so no video font setup is needed. */
export function buildCaptionHtml(text: string, placement: CaptionPlacement = "bottom"): string {
  const trimmed = text.trim()
  if (trimmed === "") throw new Error("caption text is empty")
  if (trimmed.length > MAX_CAPTION_LENGTH) {
    throw new Error(`caption is too long (${trimmed.length} > ${MAX_CAPTION_LENGTH} characters)`)
  }
  const anchor = placement === "top" ? "top:11%" : "bottom:7%"
  return `<div id="${CAPTION_ELEMENT_ID}" style="${CAPTION_STYLE};${anchor}">${escapeHtml(trimmed)}</div>`
}
