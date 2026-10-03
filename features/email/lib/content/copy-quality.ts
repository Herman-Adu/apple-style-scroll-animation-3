/**
 * Lightweight, client-safe heuristics for the subject line and preview text
 * fields in the template/campaign editors. Pure functions only — no server
 * dependency — so both editor components can import this directly.
 */

/**
 * Inbox clients clip the subject line around this length on mobile (Gmail
 * app, iOS Mail). Past this, the end of the line won't be seen.
 */
export const SUBJECT_SOFT_LIMIT = 60

/**
 * Preview/snippet text is what most clients show after the subject; it gets
 * cut off earlier than people expect.
 */
export const PREVIEW_SOFT_LIMIT = 90

/**
 * Words and patterns that commonly trip spam filters or read as "spammy" to
 * recipients when used in a subject line. Not exhaustive — just the highest
 * signal, highest frequency offenders worth flagging to a content manager.
 */
const SPAM_PATTERNS: RegExp[] = [
  /\bfree\b/i,
  /\bact now\b/i,
  /\blimited time\b/i,
  /\bbuy now\b/i,
  /\bclick here\b/i,
  /\bguarantee(d)?\b/i,
  /\bno obligation\b/i,
  /\bwinner\b/i,
  /\bcash\b/i,
  /\brisk.free\b/i,
  /\bwhile supplies last\b/i,
  /\bcongratulations\b/i,
  /\$\$\$/,
  /!!!+/,
  /\b[A-Z]{4,}\b/, // ALL-CAPS word (4+ letters), reads as shouting
]

export type CopyFlag = { label: string; match: string }

/** Scan a subject line for common spam-trigger words/patterns. */
export function findSpamFlags(subject: string): CopyFlag[] {
  const flags: CopyFlag[] = []
  for (const pattern of SPAM_PATTERNS) {
    const match = subject.match(pattern)
    if (match) flags.push({ label: match[0], match: match[0] })
  }
  return flags
}

export function charCountTone(length: number, limit: number): "ok" | "warn" | "over" {
  if (length > limit * 1.15) return "over"
  if (length > limit) return "warn"
  return "ok"
}
