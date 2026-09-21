import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Small mono kicker used above section titles and hero headlines, with an
 * optional teal indicator dot. Pure and presentational.
 */
export function Eyebrow({
  children,
  dot = true,
  className,
}: {
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/50",
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" aria-hidden /> : null}
      {children}
    </p>
  )
}
