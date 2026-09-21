// Lightweight client-side moderation for user-submitted reviews.
//
// This is a first-pass gate, not a replacement for server-side moderation.
// When a real backend is connected, run the authoritative check there too
// (Strapi lifecycle hook / route handler) — this keeps the same contract.

export type ModerationStatus = "pending" | "rejected"

export interface ModerationResult {
  /** "pending" = clean, awaiting approval. "rejected" = blocked with reasons. */
  status: ModerationStatus
  reasons: string[]
}

// Base list kept intentionally small and obfuscated; extend server-side.
// Matching is done on normalised text with common leet substitutions.
const BANNED_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "piss",
  "slut",
  "whore",
  "nigger",
  "faggot",
  "retard",
]

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
}

/** Normalise text so simple obfuscations (l33t, spacing, casing) still match. */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET_MAP[c] ?? c)
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function containsProfanity(text: string): boolean {
  const normalised = normalise(text)
  const collapsed = normalised.replace(/\s/g, "")
  return BANNED_WORDS.some((word) => {
    // Word-boundary match, plus a collapsed match to catch "f u c k".
    const boundary = new RegExp(`\\b${word}\\b`).test(normalised)
    return boundary || collapsed.includes(word)
  })
}

function looksLikeSpam(text: string): boolean {
  const urlPattern = /(https?:\/\/|www\.|\b\w+\.(com|net|org|io|shop|xyz)\b)/i
  return urlPattern.test(text)
}

function isLowEffort(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 15) return true
  // Mostly repeated characters, e.g. "aaaaaaaa" or "!!!!!!!!".
  const unique = new Set(trimmed.replace(/\s/g, "").toLowerCase())
  if (unique.size <= 2) return true
  return false
}

/**
 * Evaluate a review's text. Clean reviews are returned as "pending"
 * (awaiting human approval); problematic reviews are "rejected" with
 * human-readable reasons the UI can surface to the author.
 */
export function moderateReview(headline: string, body: string): ModerationResult {
  const combined = `${headline} ${body}`
  const reasons: string[] = []

  if (containsProfanity(combined)) {
    reasons.push("Contains language that isn't allowed. Please rephrase and try again.")
  }
  if (looksLikeSpam(combined)) {
    reasons.push("Links and web addresses aren't allowed in reviews.")
  }
  if (isLowEffort(body)) {
    reasons.push("Please add a little more detail (at least 15 characters).")
  }

  return {
    status: reasons.length > 0 ? "rejected" : "pending",
    reasons,
  }
}
