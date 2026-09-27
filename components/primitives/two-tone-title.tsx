import { cn } from "@/lib/utils"

/**
 * Renders a headline with an accent substring. The visual treatment
 * (two-tone teal / solid / whole-title gradient) is NOT decided here — it is
 * driven globally by `data-heading-style` on <html>, which the active theme
 * sets. This primitive only marks up the structure:
 *   - `.tt-title`  on the wrapper (so gradient mode can clip the whole title)
 *   - `.tt-accent` on the accented word
 * The CSS for these classes lives in globals.css. Base (non-accent) text keeps
 * the heading's own `currentColor` — never a hardcoded white — so it inherits
 * correctly on both light surfaces and always-dark cinematic media.
 *
 * Accent resolution:
 *   - An explicit `accent` substring always wins (page heroes pass one).
 *   - Otherwise we auto-accent the LAST word (including any trailing
 *     punctuation) — "Momo X" -> "X", "Designed for Precision." -> "Precision."
 *     This normalizes every headline with zero per-record data migration.
 *   - `autoAccent={false}` opts a headline out entirely (stays solid).
 *
 * Pure and presentational — safe to render on the server.
 */
export function TwoToneTitle({
  title,
  accent,
  autoAccent = true,
  className,
}: {
  title: string
  accent?: string
  autoAccent?: boolean
  className?: string
}) {
  const resolvedAccent = accent ?? (autoAccent ? lastWord(title) : undefined)
  const matchAt = resolvedAccent ? title.lastIndexOf(resolvedAccent) : -1

  if (!resolvedAccent || matchAt === -1) {
    // No accent: still tag as a title so gradient mode can tint the whole thing.
    return <span className={cn("tt-title", className)}>{title}</span>
  }

  return (
    <span className={cn("tt-title", className)}>
      {title.slice(0, matchAt)}
      <span className="tt-accent">{resolvedAccent}</span>
      {title.slice(matchAt + resolvedAccent.length)}
    </span>
  )
}

/**
 * The final whitespace-delimited token of a string (keeps trailing
 * punctuation). Splits on ANY whitespace — spaces AND newlines — so a
 * line-broken title like "Titanium\nPerformance." accents only "Performance.",
 * not the whole string.
 */
function lastWord(title: string): string | undefined {
  const match = title.trimEnd().match(/\S+$/)
  return match ? match[0] : undefined
}
