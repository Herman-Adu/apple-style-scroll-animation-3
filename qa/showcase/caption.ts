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

const CAPTION_STYLE = [
  "position:fixed",
  "left:50%",
  "bottom:7%",
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
export function buildCaptionHtml(text: string): string {
  const trimmed = text.trim()
  if (trimmed === "") throw new Error("caption text is empty")
  if (trimmed.length > MAX_CAPTION_LENGTH) {
    throw new Error(`caption is too long (${trimmed.length} > ${MAX_CAPTION_LENGTH} characters)`)
  }
  return `<div id="${CAPTION_ELEMENT_ID}" style="${CAPTION_STYLE}">${escapeHtml(trimmed)}</div>`
}
