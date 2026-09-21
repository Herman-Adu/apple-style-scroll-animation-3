import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * Shared frosted-glass surface classes, matching the site nav material.
 *
 * `glass` supplies the tint, border, and sheen (theme-aware); the Tailwind
 * `backdrop-*` utilities produce the actual blur reliably in this Tailwind v4
 * build. Apply this constant directly when the surface must be a specific
 * element (e.g. an `aside role="dialog"`), or use `<GlassPanel>` for a div.
 */
export const GLASS_SURFACE = "glass backdrop-blur-xl backdrop-saturate-150"

export function GlassPanel({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn(GLASS_SURFACE, className)} {...props}>
      {children}
    </div>
  )
}
