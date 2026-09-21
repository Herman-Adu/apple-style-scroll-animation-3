import { env } from "@/lib/env"
import { seedReviews } from "@/lib/data/reviews"
import { moderateReview } from "./moderation"
import type { Review, ReviewInput, ReviewsProvider, ReviewSummary } from "./types"

// Transport / persistence layer for reviews.
//
// Point NEXT_PUBLIC_REVIEWS_ENDPOINT at any REST backend (Strapi, a route handler)
// and reviews are read from / written to it. Without it, reviews persist in
// localStorage merged with the bundled seeds, so the feature works in preview
// with zero backend. Same pluggable pattern as the auth and contact layers.

const endpoint = env.NEXT_PUBLIC_REVIEWS_ENDPOINT
const STORE_KEY = "momo.reviews"

function readLocal(): Review[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) || "[]") as Review[]
  } catch {
    return []
  }
}

function writeLocal(reviews: Review[]) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(reviews))
}

function sortNewest(reviews: Review[]): Review[] {
  return [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

/**
 * Public visibility rule shared by every provider:
 * published reviews are shown to everyone; a viewer additionally sees
 * their own pending review so they get feedback in-session. Rejected
 * reviews are never listed.
 */
function isVisibleTo(review: Review, viewerId?: string): boolean {
  if (review.status === "published") return true
  if (review.status === "pending" && viewerId && review.authorId === viewerId) return true
  return false
}

const localProvider: ReviewsProvider = {
  async list(productSlug, viewerId) {
    const all = [...seedReviews, ...readLocal()]
    return sortNewest(
      all.filter((r) => r.productSlug === productSlug && isVisibleTo(r, viewerId)),
    )
  },
  async add(input) {
    const { status } = moderateReview(input.headline, input.body)
    const review: Review = {
      ...input,
      id: `user-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      source: "user",
      status,
    }
    // Persist only reviews that passed the gate; rejected ones are surfaced
    // to the author immediately and never stored.
    if (status !== "rejected") {
      writeLocal([...readLocal(), review])
    }
    return review
  },
}

const strapiProvider: ReviewsProvider = {
  async list(productSlug, viewerId) {
    // Ask the backend for published reviews plus this viewer's own pending one.
    // In Strapi, map "published" to the entry's publishedAt (draft & publish),
    // so moderators approve a review simply by publishing it.
    const base = `${endpoint}?filters[productSlug][$eq]=${encodeURIComponent(productSlug)}&sort=createdAt:desc&publicationState=preview`
    const res = await fetch(base)
    if (!res.ok) throw new Error("Could not load reviews.")
    const body = (await res.json()) as {
      data?: Array<{ id: number; attributes: Omit<Review, "id"> }>
    }
    return (body.data ?? [])
      .map((row) => ({ id: String(row.id), ...row.attributes }))
      .filter((r) => isVisibleTo(r, viewerId))
  },
  async add(input) {
    const { status } = moderateReview(input.headline, input.body)
    if (status === "rejected") {
      // Don't send rejected content to the backend; the UI shows the reasons.
      return {
        ...input,
        id: `rejected-${Date.now()}`,
        createdAt: new Date().toISOString(),
        source: "user",
        status,
      }
    }
    const res = await fetch(endpoint as string, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Strapi REST convention wraps the record in `data`. New reviews are
      // created unpublished (pending) until a moderator publishes them.
      body: JSON.stringify({ data: { ...input, source: "user", status: "pending" } }),
    })
    if (!res.ok) throw new Error("Could not submit your review.")
    const body = (await res.json()) as { data: { id: number; attributes: Omit<Review, "id"> } }
    return { id: String(body.data.id), ...body.data.attributes }
  },
}

export const reviewsProvider: ReviewsProvider = endpoint ? strapiProvider : localProvider

/** Pure helper: derive an aggregate summary from a list of reviews. */
export function summarize(reviews: Review[]): ReviewSummary {
  const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0]
  let total = 0
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)))
    distribution[star - 1] += 1
    total += r.rating
  }
  const count = reviews.length
  return {
    count,
    average: count ? total / count : 0,
    distribution,
  }
}
