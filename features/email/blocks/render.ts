import type { EmailBlock, EmailBranding, BlockAlign } from "./types"
import { DEFAULT_BRANDING } from "./types"

/**
 * Pure block -> HTML renderer. Framework-free and side-effect-free so it runs
 * identically at send time (server) and in the admin live preview (client).
 * Inline styles only — email clients ignore <style>/external CSS.
 */

const INK = "#0a0a0a"
const PAPER = "#ffffff"
const CANVAS = "#f4f4f5"
const MUTED = "#6b7280"
const BORDER = "#e5e7eb"
const HERO_BG = "#0b0f10"
const HERO_MUTED = "#9ca3af"

export interface RenderContext {
  /** Token map, e.g. { customer_name: "Ada", order_number: "MOMO-1024" }. */
  vars?: Record<string, string>
  /** Pre-rendered HTML for dynamic blocks, keyed by block type. */
  dynamic?: Partial<Record<EmailBlock["type"], string>>
  /**
   * Absolute origin (e.g. "https://momoaudio.com") used to rewrite root-relative
   * image paths like "/email/hero-momo.png" into fully-qualified URLs. Emails have
   * no page origin, so relative image src never loads in a mail client. Set this at
   * send time; the admin live preview omits it and relies on the page origin.
   */
  baseUrl?: string
}

/**
 * Resolve an image path to an absolute URL when a baseUrl is provided. Already
 * absolute URLs (http/https, protocol-relative, data:) pass through untouched so
 * CMS media and admin-entered full URLs are never double-prefixed. Without a
 * baseUrl the value is returned as-is (client preview against the page origin).
 */
function resolveSrc(src: string, baseUrl?: string): string {
  const s = String(src ?? "")
  if (!baseUrl || !s) return s
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("data:")) return s
  const base = baseUrl.replace(/\/$/, "")
  return `${base}${s.startsWith("/") ? s : `/${s}`}`
}

/** Escape user text destined for an HTML context. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Replace {{token}} occurrences from the vars map (unknown tokens -> ""). */
function fillTokens(s: string, vars: Record<string, string> = {}): string {
  return String(s ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => vars[key] ?? "")
}

/**
 * Render *accented* spans: text wrapped in single asterisks is emphasized in the
 * brand accent color. Everything else is escaped. Used by hero/heading so staff
 * can highlight words the way the brand hero does ("reference instrument").
 */
function accentize(raw: string, accent: string): string {
  const parts = String(raw ?? "").split(/(\*[^*]+\*)/g)
  return parts
    .map((part) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return `<span style="color:${accent};">${esc(part.slice(1, -1))}</span>`
      }
      return esc(part)
    })
    .join("")
}

function prep(s: string, vars: Record<string, string>): string {
  return fillTokens(s, vars)
}

function alignToCss(align: BlockAlign | undefined): string {
  return align === "center" ? "center" : align === "right" ? "right" : "left"
}

function renderBlock(block: EmailBlock, brand: EmailBranding, ctx: RenderContext): string {
  const vars = ctx.vars ?? {}
  const accent = brand.accentColor || DEFAULT_BRANDING.accentColor

  switch (block.type) {
    case "hero": {
      const img = resolveSrc(block.imageUrl || brand.heroImageUrl, ctx.baseUrl)
      const align = alignToCss(block.align)
      const underlineAlign = align === "center" ? "margin:20px auto 0;" : align === "right" ? "margin:20px 0 0auto;" : "margin:20px 0 0;"
      return `
      <tr>
        <td style="padding:0;">
          <div style="background:${HERO_BG};border-radius:16px 16px 0 0;overflow:hidden;">
            ${
              img
                ? `<img src="${esc(img)}" alt="" width="100%" style="display:block;width:100%;max-height:280px;object-fit:cover;border:0;" />`
                : ""
            }
            <div style="padding:32px 28px;text-align:${align};">
              ${
                block.eyebrow
                  ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${accent};margin:0 0 14px;">${esc(prep(block.eyebrow, vars))}</div>`
                  : ""
              }
              <div style="font-size:30px;line-height:1.15;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">
                ${accentize(prep(block.heading, vars), accent)}
              </div>
              ${
                block.subheading
                  ? `<div style="margin:14px 0 0;font-size:15px;line-height:1.6;color:${HERO_MUTED};">${accentize(prep(block.subheading, vars), accent)}</div>`
                  : ""
              }
              <div style="width:56px;height:3px;background:${accent};border-radius:2px;${underlineAlign}"></div>
            </div>
          </div>
        </td>
      </tr>`
    }

    case "heading": {
      const align = alignToCss(block.align)
      return `
      <tr><td style="padding:8px 28px 0;">
        <h2 style="margin:0;font-size:20px;line-height:1.3;font-weight:700;color:${INK};text-align:${align};">
          ${accentize(prep(block.text, vars), accent)}
        </h2>
      </td></tr>`
    }

    case "text": {
      const align = alignToCss(block.align)
      return `
      <tr><td style="padding:12px 28px 0;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:${MUTED};text-align:${align};">
          ${accentize(prep(block.text, vars), accent).replace(/\n/g, "<br />")}
        </p>
      </td></tr>`
    }

    case "button": {
      const align = alignToCss(block.align)
      return `
      <tr><td style="padding:24px 28px 4px;text-align:${align};">
        <a href="${esc(prep(block.href, vars) || "#")}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 30px;border-radius:9999px;">
          ${esc(prep(block.label, vars))}
        </a>
      </td></tr>`
    }

    case "image": {
      const tag = `<img src="${esc(resolveSrc(prep(block.src, vars), ctx.baseUrl))}" alt="${esc(block.alt)}" width="100%" style="display:block;width:100%;border:0;border-radius:12px;" />`
      return `
      <tr><td style="padding:16px 28px 0;">
        ${block.href ? `<a href="${esc(prep(block.href, vars))}" style="text-decoration:none;">${tag}</a>` : tag}
      </td></tr>`
    }

    case "divider":
      return `
      <tr><td style="padding:24px 28px 0;">
        <div style="height:1px;background:${BORDER};line-height:1px;font-size:0;">&nbsp;</div>
      </td></tr>`

    case "spacer": {
      const h = block.size === "lg" ? 40 : block.size === "sm" ? 12 : 24
      return `<tr><td style="padding:0;height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</td></tr>`
    }

    case "list": {
      const tag = block.ordered ? "ol" : "ul"
      const items = block.items
        .filter((i) => i.trim())
        .map(
          (i) =>
            `<li style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${MUTED};">${accentize(prep(i, vars), accent)}</li>`,
        )
        .join("")
      return `
      <tr><td style="padding:16px 28px 0;">
        ${block.title ? `<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${INK};">${esc(prep(block.title, vars))}</p>` : ""}
        <${tag} style="margin:0;padding-left:20px;">${items}</${tag}>
      </td></tr>`
    }

    case "callout": {
      return `
      <tr><td style="padding:20px 28px 0;">
        <div style="background:${CANVAS};border:1px solid ${BORDER};border-left:3px solid ${accent};border-radius:10px;padding:18px 20px;">
          ${block.title ? `<p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${INK};">${accentize(prep(block.title, vars), accent)}</p>` : ""}
          <p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">${accentize(prep(block.body, vars), accent).replace(/\n/g, "<br />")}</p>
        </div>
      </td></tr>`
    }

    case "orderSummary":
      return ctx.dynamic?.orderSummary ?? ""

    default:
      return ""
  }
}

/** Render just the inner block rows (used to compose dynamic transactional emails). */
export function renderBlocks(blocks: EmailBlock[], brand: EmailBranding, ctx: RenderContext = {}): string {
  return blocks.map((b) => renderBlock(b, brand, ctx)).join("")
}

/** Wrap rendered rows in the branded email shell (canvas, card, footer). */
export function renderEmail(blocks: EmailBlock[], brand: EmailBranding, ctx: RenderContext = {}): string {
  const b = { ...DEFAULT_BRANDING, ...brand }
  const inner = renderBlocks(blocks, b, ctx)
  const footerText = b.footerText || DEFAULT_BRANDING.footerText

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:28px 12px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};border:1px solid ${BORDER};border-radius:16px;border-collapse:separate;overflow:hidden;">
        ${inner}
        <tr><td style="padding:0 28px 32px;"></td></tr>
      </table>
      <p style="text-align:center;color:${MUTED};font-size:12px;line-height:1.6;margin:20px 0 0;">
        ${esc(footerText)}<br />
        <span style="color:#9ca3af;">${esc(b.brandName)} · ${esc(b.footerCities)}</span>
        ${b.address ? `<br /><span style="color:#9ca3af;">${esc(b.address)}</span>` : ""}
      </p>
    </div>
  </body>
</html>`
}

/** Plain-text fallback derived from blocks (basic, for deliverability). */
export function renderText(blocks: EmailBlock[], brand: EmailBranding, ctx: RenderContext = {}): string {
  const vars = ctx.vars ?? {}
  const strip = (s: string) => fillTokens(s, vars).replace(/\*/g, "")
  const lines: string[] = []
  for (const block of blocks) {
    switch (block.type) {
      case "hero":
        if (block.eyebrow) lines.push(strip(block.eyebrow).toUpperCase())
        lines.push(strip(block.heading))
        if (block.subheading) lines.push(strip(block.subheading))
        lines.push("")
        break
      case "heading":
        lines.push(strip(block.text))
        break
      case "text":
      case "callout":
        lines.push(strip("body" in block ? `${block.title ? block.title + ": " : ""}${block.body}` : block.text))
        break
      case "button":
        lines.push(`${strip(block.label)}: ${strip(block.href)}`)
        break
      case "list":
        if (block.title) lines.push(strip(block.title))
        block.items.filter((i) => i.trim()).forEach((i, idx) => lines.push(`${block.ordered ? `${idx + 1}.` : "-"} ${strip(i)}`))
        break
      default:
        break
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
