import { cn } from "@/lib/utils"

/**
 * Renders a headline with an optional accent substring in a subtle teal
 * gradient (two-tone). Falls back to the plain title if the accent isn't found.
 * Pure and presentational — safe to render on the server.
 */
export function TwoToneTitle({
  title,
  accent,
  className,
}: {
  title: string
  accent?: string
  className?: string
}) {
  if (!accent) return <>{title}</>
  const at = title.indexOf(accent)
  if (at === -1) return <>{title}</>
  return (
    <>
      {title.slice(0, at)}
      <span
        className={cn(
          "bg-gradient-to-r from-accent-teal to-accent-teal-muted bg-clip-text text-transparent",
          className,
        )}
      >
        {accent}
      </span>
      {title.slice(at + accent.length)}
    </>
  )
}
