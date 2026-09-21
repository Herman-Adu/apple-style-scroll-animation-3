import { cn } from "@/lib/utils"

/**
 * A short teal-to-transparent hairline used as a restrained accent beneath
 * titles and section headings.
 */
export function AccentDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-24 bg-gradient-to-r from-accent-teal to-transparent", className)}
      aria-hidden
    />
  )
}
