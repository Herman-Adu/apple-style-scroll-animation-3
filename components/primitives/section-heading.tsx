import type { ElementType } from "react"
import type { HeadingTier } from "@/features/settings"
import { TwoToneTitle } from "./two-tone-title"

/**
 * The single entry point for every section/heading on the site. It renders the
 * requested heading element and runs the text through `TwoToneTitle`, so the
 * brand accent, heading style (two-tone / solid / gradient) and per-tier accent
 * reach all follow the active theme with zero per-page decisions.
 *
 * Use it instead of a bare `<h1>`/`<h2>`/`<h3>` so new headings are on-brand by
 * default and re-theme globally. The accent TIER — which independent on/off
 * toggle governs this heading — is derived automatically:
 *   - `emphasis="secondary"`  -> "card"  tier (repeated cards, list/timeline titles)
 *   - `as="h1"`               -> "h1"    tier (page/hero titles)
 *   - otherwise               -> "h2"    tier (section headlines, the default)
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
  const tier: HeadingTier = emphasis === "secondary" ? "card" : Tag === "h1" ? "h1" : "h2"
  return (
    <Tag className={className}>
      <TwoToneTitle title={title} accent={accent} autoAccent={autoAccent} tier={tier} />
    </Tag>
  )
}
