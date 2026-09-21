"use client"

/**
 * Client island that renders a Mermaid diagram (architecture, sequence, ER,
 * flow, state, journey). It is the ONLY client code on an otherwise
 * server-rendered docs page — the RSC renderer hands it a diagram string and
 * this island lazy-imports `mermaid` on mount so the ~500KB library never ships
 * with the initial page.
 *
 * Theming: Mermaid needs concrete colors, so we read the app's live CSS custom
 * properties off <html> at render time and map them onto Mermaid's `base`
 * theme. A MutationObserver re-renders when the theme class flips, keeping
 * diagrams in sync with light/dark without a prop.
 *
 * Color normalization: the brand tokens are authored in `oklch()`, which modern
 * browsers return from getComputedStyle as `oklch()`/`lab()`. Mermaid's color
 * parser (khroma) only understands hex/rgb/hsl, so every resolved token is run
 * through a canvas 2D context — it parses CSS Color 4 and serializes back to an
 * sRGB `#rrggbb`/`rgba(...)` string Mermaid accepts.
 */

import { useEffect, useId, useRef, useState } from "react"

type Props = {
  diagram: string
  title?: string
  caption?: string
}

/**
 * Normalize any CSS color (including `oklch()`/`lab()`) to an sRGB `rgb()`/
 * `rgba()` string. We can't rely on `ctx.fillStyle` serialization — modern
 * browsers round-trip it back as `lab()`, which Mermaid still can't parse — so
 * we rasterize a single pixel and read its sRGB bytes with getImageData. That
 * always yields numeric channels regardless of the source color space.
 */
function toRenderableColor(color: string, fallback: string): string {
  if (typeof document === "undefined") return fallback
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return fallback
  try {
    // Seed with the (renderable) fallback so an unparseable color still paints.
    ctx.fillStyle = fallback
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
  } catch {
    return fallback
  }
}

/** Read a CSS custom property off the document root and normalize it. */
function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return toRenderableColor(value || fallback, fallback)
}

export function MermaidDiagram({ diagram, title, caption }: Props) {
  const rawId = useId()
  const renderId = `mmd-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default

        const foreground = readToken("--foreground", "#f2f2f2")
        const background = readToken("--background", "#050505")
        const card = readToken("--card", "#0c0c0c")
        const border = readToken("--border", "#333333")
        const muted = readToken("--muted-foreground", "#999999")
        const teal = readToken("--accent-teal", "#5ec8c8")
        const secondary = readToken("--secondary", "#1a1a1a")

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          // A concrete font stack (not a CSS variable) so Mermaid's label
          // measurement matches what actually renders — a mismatch here is what
          // makes node boxes size too small and clip their text.
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
          // htmlLabels render labels as real DOM (foreignObject) so boxes size
          // to their true content, and `wrap` breaks long labels onto multiple
          // lines instead of overflowing.
          flowchart: {
            htmlLabels: true,
            wrap: true,
            useMaxWidth: true,
            padding: 14,
            nodeSpacing: 55,
            rankSpacing: 60,
            diagramPadding: 12,
          },
          sequence: {
            useMaxWidth: true,
            wrap: true,
            width: 160,
          },
          er: {
            useMaxWidth: true,
          },
          themeVariables: {
            darkMode: true,
            background,
            mainBkg: card,
            primaryColor: card,
            primaryTextColor: foreground,
            primaryBorderColor: teal,
            secondaryColor: secondary,
            tertiaryColor: background,
            lineColor: muted,
            textColor: foreground,
            nodeBorder: border,
            clusterBkg: secondary,
            clusterBorder: border,
            titleColor: foreground,
            edgeLabelBackground: background,
            // sequence diagrams
            actorBkg: card,
            actorBorder: teal,
            actorTextColor: foreground,
            actorLineColor: muted,
            signalColor: foreground,
            signalTextColor: foreground,
            labelBoxBkgColor: secondary,
            labelBoxBorderColor: border,
            labelTextColor: foreground,
            loopTextColor: foreground,
            noteBkgColor: secondary,
            noteTextColor: foreground,
            noteBorderColor: border,
            // state / er
            fillType0: card,
            fillType1: secondary,
          },
        })

        // Validate first so a bad diagram surfaces a friendly message.
        await mermaid.parse(diagram)
        const { svg: out } = await mermaid.render(renderId, diagram)
        if (active) {
          setSvg(out)
          setError(null)
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to render diagram")
      }
    }

    render()

    // Re-render when the theme class on <html> changes.
    const observer = new MutationObserver(() => render())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => {
      active = false
      observer.disconnect()
    }
  }, [diagram, renderId])

  // After the SVG is injected, level every flowchart node to the tallest one so
  // single-line and wrapped (2-line) boxes share a uniform height. Each rect is
  // re-centered on its original vertical midpoint, so labels stay centered and
  // edges still meet the box borders.
  useEffect(() => {
    if (!svg) return
    const root = containerRef.current
    if (!root) return

    const rects = Array.from(
      root.querySelectorAll<SVGRectElement>("g.node rect.label-container, g.node rect.basic"),
    )
    if (rects.length === 0) return

    const heightOf = (rect: SVGRectElement) =>
      parseFloat(rect.getAttribute("height") || "0") || rect.getBBox().height
    const maxH = Math.max(...rects.map(heightOf))
    if (!Number.isFinite(maxH) || maxH <= 0) return

    for (const rect of rects) {
      const h = heightOf(rect)
      const y = parseFloat(rect.getAttribute("y") || "0")
      const centerY = y + h / 2
      rect.setAttribute("height", String(maxH))
      rect.setAttribute("y", String(centerY - maxH / 2))
    }
  }, [svg])

  return (
    <figure className="my-10">
      {title && (
        <figcaption className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto rounded-2xl border border-foreground/10 bg-card/50 p-6 backdrop-blur-sm">
        {error ? (
          <p className="font-mono text-xs text-destructive">Diagram error: {error}</p>
        ) : svg ? (
          <div
            ref={containerRef}
            className="mermaid-rendered flex min-h-[120px] items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full"
            // Mermaid output is generated from our own trusted, hard-coded docs
            // content (no user input), so securityLevel "loose" is safe here and
            // is what lets htmlLabels size/wrap node text correctly.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex min-h-[120px] items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30">
              Rendering diagram…
            </span>
          </div>
        )}
      </div>
      {caption && <figcaption className="mt-3 text-center text-xs text-foreground/40">{caption}</figcaption>}
    </figure>
  )
}
