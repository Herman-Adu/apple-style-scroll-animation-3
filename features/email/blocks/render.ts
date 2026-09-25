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
      const underlineAlign =
        align === "center" ? "margin:22px auto 0;" : align === "right" ? "margin:22px 0 0 auto;" : "margin:22px 0 0;"
      return `
      <tr>
        <td style="padding:0;background:${HERO_BG};">
          ${
            img
              ? `<img src="${esc(img)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;margin:0;" />`
              : ""
          }
          <div style="padding:36px 32px 40px;text-align:${align};background:${HERO_BG};">
            ${
              block.eyebrow
                ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.32em;text-transform:uppercase;color:${accent};margin:0 0 16px;">${esc(prep(block.eyebrow, vars))}</div>`
                : ""
            }
            <div style="font-size:34px;line-height:1.12;font-weight:800;letter-spacing:-0.02em;color:#ffffff;margin:0;">
              ${accentize(prep(block.heading, vars), accent)}
            </div>
            ${
              block.subheading
                ? `<div style="margin:16px 0 0;font-size:15px;line-height:1.65;color:${HERO_MUTED};">${accentize(prep(block.subheading, vars), accent)}</div>`
                : ""
            }
            <div style="width:60px;height:3px;background:${accent};border-radius:2px;${underlineAlign}"></div>
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

/**
 * Wrap rendered rows in the branded email shell. The brand header (wordmark) and
 * the company footer are applied automatically to EVERY email from the shared
 * EmailSettings branding — they are not blocks an admin adds per template, so the
 * legally-required company details stay consistent and change in one place only.
 */
export function renderEmail(blocks: EmailBlock[], brand: EmailBranding, ctx: RenderContext = {}): string {
  const b = { ...DEFAULT_BRANDING, ...brand }
  const inner = renderBlocks(blocks, b, ctx)
  const accent = b.accentColor || DEFAULT_BRANDING.accentColor
  const footerText = b.footerText || DEFAULT_BRANDING.footerText
  const year = new Date().getFullYear()

  const wordmark = (size: number, color: string) =>
    `<span style="font-size:${size}px;font-weight:800;letter-spacing:0.4em;text-transform:uppercase;color:${color};padding-left:0.4em;">${esc(b.brandName)}</span>`

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:28px 12px 40px;">
      <!-- Brand header (automatic) -->
      <div style="text-align:center;padding:2px 0 20px;">
        ${wordmark(19, INK)}
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};border:1px solid ${BORDER};border-radius:16px;border-collapse:separate;overflow:hidden;">
        ${inner}
        <tr><td style="padding:0 28px 32px;"></td></tr>
      </table>

      <!-- Company footer (automatic — sourced from brand settings) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:26px 20px 0;text-align:center;">
            <div style="margin:0 0 10px;">${wordmark(13, "#9ca3af")}</div>
            <p style="margin:0 0 14px;color:${MUTED};font-size:12px;line-height:1.6;">${esc(footerText)}</p>
            <div style="width:40px;height:1px;background:${accent};opacity:0.5;margin:0 auto 14px;line-height:1px;font-size:0;">&nbsp;</div>
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.7;">
              ${esc(b.brandName)}${b.footerCities ? ` &middot; ${esc(b.footerCities)}` : ""}
              ${b.address ? `<br />${esc(b.address)}` : ""}
              ${
                b.supportEmail
                  ? `<br /><a href="mailto:${esc(b.supportEmail)}" style="color:#9ca3af;text-decoration:underline;">${esc(b.supportEmail)}</a>`
                  : ""
              }
            </p>
            <p style="margin:14px 0 0;color:#b6bcc6;font-size:11px;line-height:1.6;">&copy; ${year} ${esc(b.brandName)}. All rights reserved.</p>
          </td>
        </tr>
      </table>
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
