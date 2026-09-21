// Domain types for the product reviews system.
// UI, seed data, and the provider all depend on these — never on a concrete backend.

/**
 * Moderation state of a review.
 * - published: approved and visible to everyone.
 * - pending: passed the automated gate, awaiting approval — visible only to its author.
 * - rejected: blocked by the automated gate (profanity / spam / low effort).
 */
export type ReviewStatus = "published" | "pending" | "rejected"

export interface Review {
  id: string
  /** Product this review belongs to, matched to a product slug. */
  productSlug: string
  /** Account id of the author, when submitted by a signed-in user. */
  authorId?: string
  author: string
  /** Optional avatar (data URL or hosted URL); falls back to initials in the UI. */
  avatarUrl?: string
  /** 1–5 stars. */
  rating: number
  headline: string
  body: string
  createdAt: string
  /** Whether the review came from the current visitor (local, unmoderated). */
  source: "seed" | "user"
  /** Moderation state; drives public visibility. */
  status: ReviewStatus
}

export interface ReviewInput {
  productSlug: string
  authorId?: string
  author: string
  avatarUrl?: string
  rating: number
  headline: string
  body: string
}

/** Aggregate rating summary for a product. */
export interface ReviewSummary {
  count: number
  average: number
  /** Count per star, index 0 = 1 star … index 4 = 5 stars. */
  distribution: [number, number, number, number, number]
}

/**
 * Port the UI depends on. The active implementation is chosen in provider.ts.
 * A Strapi/REST implementation can satisfy the same contract without UI changes.
 */
export interface ReviewsProvider {
  /**
   * Returns published reviews for the product, plus the viewer's own pending
   * review (when `viewerId` is provided) so authors get in-session feedback.
   */
  list(productSlug: string, viewerId?: string): Promise<Review[]>
  add(input: ReviewInput): Promise<Review>
}
