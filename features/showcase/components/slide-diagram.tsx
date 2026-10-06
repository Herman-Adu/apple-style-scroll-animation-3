"use client"

import { useEffect, useId, useRef, useState } from "react"
import { ADUDEV } from "../lib/domain/brand"

type Props = {
  source: string
  alt: string
}

const { colors } = ADUDEV

const NODE_STYLES = [
  `classDef denied fill:${colors.surface},stroke:${colors.orange},stroke-width:3px,color:${colors.text}`,
].join("\n")

export function SlideDiagram({ source, alt }: Props) {
  const rawId = useId()
  const renderId = `slide-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default
        await document.fonts.ready
        const fontFamily = getComputedStyle(containerRef.current ?? document.body).fontFamily

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          fontFamily,
          flowchart: { htmlLabels: true, useMaxWidth: true, padding: 14, nodeSpacing: 36, rankSpacing: 40, diagramPadding: 4, wrappingWidth: 360 },
          themeVariables: {
            fontSize: "20px",
            darkMode: true,
            background: colors.base,
            mainBkg: colors.surface,
            primaryColor: colors.surface,
            primaryTextColor: colors.text,
            primaryBorderColor: colors.border,
            lineColor: colors.muted,
            textColor: colors.text,
            nodeBorder: colors.border,
            edgeLabelBackground: colors.base,
            tertiaryColor: colors.base,
          },
        })

        const { svg: out } = await mermaid.render(renderId, `${source}\n${NODE_STYLES}`)
        if (active) setSvg(out)
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to render diagram")
      }
    }

    render()
    return () => {
      active = false
    }
  }, [source, renderId])

  // The capture script waits until no diagram is still pending.
  const state = error ? "error" : svg ? "ready" : "pending"

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      data-slide-diagram={state}
      className="flex h-full w-full items-center justify-center [&_svg]:h-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:max-w-full"
    >
      {error ? <p className="font-mono text-2xl text-muted-foreground">Diagram error: {error}</p> : null}
      {svg ? <div className="flex h-full w-full items-center justify-center" dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    </div>
  )
}
