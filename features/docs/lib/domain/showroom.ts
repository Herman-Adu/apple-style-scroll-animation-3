/**
 * Showroom coverage: does the public CTO layer answer the objections the
 * owner-gated pitch commits to answering?
 *
 * The nine `Positioning` docs are owner-only — what the owner charges, how they
 * pitch, and the questions they answer in a live sales conversation. The public
 * CTO docs are what a post links to, read by a buyer with nobody in the room.
 * Four gated docs carry an objection-handling section, and those sections are
 * the source of truth here: the objections are parsed out of them rather than
 * listed by hand, because a hand-written list can only ever check the past.
 * That is how What's New drifted for eleven sprints before S50, and the same
 * shape S57 found in the proof page — a claim made where nobody can check it.
 *
 * Everything here is pure: docs and text come in, findings go out, so only the
 * guard in `qa/unit/docs/showroom-coverage.test.ts` touches the corpus.
 */

import type { Doc, DocAccess, DocAudience } from "./schema"

/** One objection the gated pitch commits to answering. */
export type Objection = {
  /** Normalised, stable across punctuation and casing. The manifest key. */
  key: string
  /** The question as the gated doc words it. */
  question: string
  /** The gated doc it was parsed from. */
  source: string
}

/**
 * The gated docs that carry an objection-handling section today. Derived in the
 * guard and compared against this list, so a source losing its section — or a
 * parser that quietly returns nothing — fails instead of passing vacuously.
 */
export const OBJECTION_SOURCES = [
  "positioning-and-selling-the-platform",
  "email-system-selling-points",
  "sales-demo-and-objection-handling",
  "tier-deliverables",
] as const

/**
 * The number of objections the gated pitch carried when the guard was written.
 * Pinned so lowering it — which weakens the guard — shows up in a diff.
 */
export const OBJECTION_FLOOR = 19

/** Lowercase words only, so quotes, apostrophes and trailing stops never matter. */
export function objectionKey(question: string): string {
  return question
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/**
 * The objections in a doc's objection-handling section: the titles of a `steps`
 * block, and the first column of a table whose first header is "Objection".
 * Blocks outside that section are ignored — the surrounding prose is advice to
 * the seller, not a question a buyer asks.
 */
export function parseObjections(doc: Doc): Objection[] {
  const found: Objection[] = []
  let inSection = false

  for (const block of doc.body) {
    if (block.type === "heading") {
      inSection = /objection/i.test(block.text)
      continue
    }
    if (!inSection) continue

    if (block.type === "steps") {
      for (const item of block.items) found.push(objection(item.title, doc.slug))
    }
    if (block.type === "table" && /objection/i.test(block.headers[0] ?? "")) {
      for (const row of block.rows) if (row[0]) found.push(objection(row[0], doc.slug))
    }
  }

  return found
}

function objection(question: string, source: string): Objection {
  return { key: objectionKey(question), question, source }
}

/** Where the public layer answers an objection, and the words that prove it does. */
export type PublicAnswer = {
  /** Slug of the public CTO doc carrying the answer. */
  doc: string
  /** Phrases that must still be in that doc's text for the answer to be there. */
  anchors: readonly string[]
}

/**
 * One public answer per objection, keyed by `objectionKey`.
 *
 * Anchors are the words that carry the answer, not a summary of it: if an edit
 * removes them the answer has gone, whatever else the page still says. They are
 * deliberately category words — "rented", "per-contact", "all-in-one platform" —
 * because the public docs name categories and the gated script says to position
 * against an alternative rather than rubbish it by name.
 */
export const PUBLIC_ANSWERS: Readonly<Record<string, PublicAnswer>> = {
  // positioning-and-selling-the-platform
  "it costs more than a template": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["cheap template", "build premium"],
  },
  "we already have a cms": {
    doc: "build-vs-buy-the-decision",
    anchors: ["CMS is a seam", "mapper change"],
  },
  "how do we know it will not break": {
    doc: "engineering-quality",
    anchors: ["pull request", "before code"],
  },
  "can our team maintain it": {
    doc: "why-this-technology-stack",
    anchors: ["maintain"],
  },

  // email-system-selling-points
  "mailchimp is cheaper to start": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["per-contact", "as the list grows"],
  },
  "deliverability is why we pay an esp": {
    doc: "security-and-compliance-posture",
    anchors: ["deliverability", "every send is logged"],
  },
  "our marketing team needs to run this not developers": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["editors self-serve", "without a deploy"],
  },
  "what if we outgrow it": {
    doc: "scale-performance-and-reliability",
    anchors: ["autoscales", "as the catalog and the traffic grow"],
  },

  // sales-demo-and-objection-handling
  "why not just use shopify": {
    doc: "build-vs-buy-the-decision",
    anchors: ["All-in-one platform", "lock-in"],
  },
  "why not klaviyo mailchimp for email": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["rented", "per-contact"],
  },
  "isnt a custom build risky": {
    doc: "build-vs-buy-the-decision",
    anchors: ["Purpose-built stack", "replatform"],
  },
  "who maintains it if you disappear": {
    doc: "engineering-quality",
    anchors: ["another developer", "architecture decision records"],
  },
  "what about email deliverability": {
    doc: "security-and-compliance-posture",
    anchors: ["authenticated sending domain", "opt-in"],
  },
  "can non technical staff actually use it": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["editors self-serve"],
  },
  "whats the real cost saving": {
    doc: "roi-and-total-cost-of-ownership",
    anchors: ["three cost centers", "flatter cost curve"],
  },

  // tier-deliverables
  "do we own the code": {
    doc: "what-you-receive",
    anchors: ["source escrow", "release triggers"],
  },
  "are we locked into a retainer": {
    doc: "what-you-receive",
    anchors: ["rolling monthly", "no exit fee"],
  },
  "what if we want to move to another developer": {
    doc: "what-you-receive",
    anchors: ["another developer", "runbook"],
  },
  "why are the stripe and resend accounts in our name": {
    doc: "what-you-receive",
    anchors: ["in your name", "your customers pay you directly"],
  },
}

/**
 * Does `text` carry this anchor as its own phrase?
 *
 * Word-boundary matching, with the hyphen counted as part of a word: a bare
 * substring search finds "ESP" inside "responses" and "page" inside "per-page
 * tax", and would report an answer that is not there (S52: a mention is not the
 * thing — judge the span that holds it).
 */
export function mentionsAnchor(text: string, anchor: string): boolean {
  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "i").test(text)
}

/** Objections with no entry in the manifest at all. */
export function unansweredObjections(
  objections: readonly Objection[],
  answers: Readonly<Record<string, PublicAnswer>> = PUBLIC_ANSWERS,
): string[] {
  return objections
    .filter((objection) => !(objection.key in answers))
    .map((objection) => `${objection.source}: "${objection.question}"`)
}

/** Manifest entries whose objection is no longer in the gated pitch. */
export function staleAnswers(
  objections: readonly Objection[],
  answers: Readonly<Record<string, PublicAnswer>> = PUBLIC_ANSWERS,
): string[] {
  const live = new Set(objections.map((objection) => objection.key))
  return Object.keys(answers).filter((key) => !live.has(key))
}

/** The public doc fields the drift check needs, so it never reads the corpus itself. */
export type ShowroomDoc = {
  slug: string
  text: string
  access: DocAccess
  audience: DocAudience
}

/**
 * Manifest entries whose public answer has gone: the doc was deleted, moved out
 * of the public CTO layer, or edited until the anchors it was pinned on are no
 * longer in it.
 */
export function driftedAnswers(
  answers: Readonly<Record<string, PublicAnswer>> = PUBLIC_ANSWERS,
  showroom: readonly ShowroomDoc[] = [],
): string[] {
  const bySlug = new Map(showroom.map((doc) => [doc.slug, doc]))

  return Object.entries(answers).flatMap(([key, answer]) => {
    const doc = bySlug.get(answer.doc)
    if (!doc) return [`${key} → ${answer.doc}: no such doc`]
    if (doc.access !== "public") return [`${key} → ${answer.doc}: gated, so the buyer never reads it`]
    if (doc.audience !== "cto") return [`${key} → ${answer.doc}: not in the CTO layer`]

    return answer.anchors
      .filter((anchor) => !mentionsAnchor(doc.text, anchor))
      .map((anchor) => `${key} → ${answer.doc}: lost the words "${anchor}"`)
  })
}
