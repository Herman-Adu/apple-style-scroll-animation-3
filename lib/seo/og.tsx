import { ImageResponse } from "next/og"

/**
 * Shared renderer for dynamic Open Graph images so every route produces a
 * consistent, on-brand card. Typographic by design (no remote photo fetches)
 * to stay fast and dependency-free during static generation. Styles use
 * Satori-safe primitives (explicit flex, hex/rgba colours).
 */

export const OG_SIZE = { width: 1200, height: 630 } as const

const TEAL = "#5cb8b2"

export function renderOgImage({
  eyebrow,
  title,
  footer,
}: {
  eyebrow: string
  title: string
  footer: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "560px",
            height: "560px",
            background: `radial-gradient(circle at 72% 28%, rgba(92,184,178,0.28), transparent 60%)`,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: TEAL }} />
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              letterSpacing: "8px",
              color: "#a1a1aa",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "76px",
            fontWeight: 700,
            color: "#fafafa",
            lineHeight: 1.05,
            maxWidth: "1010px",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: "30px", fontWeight: 700, letterSpacing: "6px", color: "#fafafa" }}>
            MOMO
          </div>
          <div style={{ display: "flex", fontSize: "24px", color: TEAL, maxWidth: "620px" }}>{footer}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
