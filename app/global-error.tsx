"use client"

import { useEffect } from "react"

/**
 * Last-resort boundary for errors thrown in the root layout itself, where the
 * normal `error.tsx` can't render. It must supply its own <html>/<body>. Kept
 * dependency-free and inline-styled so it works even if the app shell (fonts,
 * globals, providers) is what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#5eead4" }}>
          Something broke
        </p>
        <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700, maxWidth: "32rem" }}>
          The app hit an unexpected error.
        </h1>
        <button
          onClick={reset}
          style={{
            border: "none",
            borderRadius: "9999px",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            background: "#fafafa",
            color: "#0a0a0a",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
