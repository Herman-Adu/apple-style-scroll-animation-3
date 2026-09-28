import type { ElementType } from "react"
import { TwoToneTitle } from "./two-tone-title"

/**
 * The single entry point for every section/heading on the site. It renders the
 * requested heading element and runs the text through `TwoToneTitle`, so the
 * brand accent, heading style (two-tone / solid / gradient) and reach
 * (`headingScope`) all follow the active theme with zero per-page decisions.
 *
 * Use it instead of a bare `<h1>`/`<h2>`/`<h3>` so new headings are on-brand by
 * default and re-theme globally:
 *   - `emphasis="primary"`   (default) — heroes and section titles; always accented.
 *   - `emphasis="secondary"` — repeated cards / list titles; only accented when
 *     the theme's scope is "all".
 *
 * Pure and presentational — safe to render on the server.
 */
export function SectionHeading({
  as: Tag = "h2",
  title,
  accent,
  autoAccent = true,
  emphasis = "primary",
  className,
}: {
  as?: ElementType
  title: string
  /** Explicit accent substring. Omit to auto-accent the last word. */
  accent?: string
  autoAccent?: boolean
  emphasis?: "primary" | "secondary"
  className?: string
}) {
  return (
    <Tag className={className}>
      <TwoToneTitle title={title} accent={accent} autoAccent={autoAccent} emphasis={emphasis} />
    </Tag>
  )
}
