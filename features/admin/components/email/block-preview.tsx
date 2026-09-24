"use client"

import { useMemo } from "react"
import { renderEmail } from "@/features/email/blocks/render"
import type { EmailBlock, EmailBranding } from "@/features/email/blocks/types"
import { sampleVars, SAMPLE_ORDER_SUMMARY } from "@/features/email/blocks/sample"
import { cn } from "@/lib/utils"

/**
 * Live email preview. Renders the exact same block HTML that gets sent, inside a
 * sandboxed iframe so the email's inline styles can't leak into the admin UI.
 * Pure — recomputes only when blocks or branding change.
 */
export function BlockPreview({
  blocks,
  branding,
  className,
}: {
  blocks: EmailBlock[]
  branding: EmailBranding
  className?: string
}) {
  const html = useMemo(
    () =>
      renderEmail(blocks, branding, {
        vars: sampleVars(branding),
        dynamic: { orderSummary: SAMPLE_ORDER_SUMMARY },
      }),
    [blocks, branding],
  )

  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      sandbox=""
      className={cn("h-full w-full rounded-xl border border-border bg-white", className)}
    />
  )
}
