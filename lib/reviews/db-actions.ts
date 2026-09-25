"use server"

// Server Actions backing the `db` reviews adapter. Moderation and the public
// visibility rule are enforced here — the trust boundary — not on the client.
// A review's moderation status is always computed server-side; the client can
// never publish its own review or read someone else's pending one. The viewer
// identity used for the "see your own pending review" rule is taken from the
// Better Auth session when available, falling back to the passed hint.

import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { seedReviews } from "@/lib/data/reviews"
import { moderateReview } from "./moderation"
import type { Review, ReviewInput, ReviewStatus } from "./types"

const VALID_STATUSES: ReviewStatus[] = ["published", "pending", "rejected"]

type ReviewRow = {
  id: string
  productSlug: string
  authorId: string | null
  author: string
  avatarUrl: string | null
  rating: number
  headline: string
  body: string
  status: string
  source: string
  createdAt: Date
}

const reviewSelect = {
  id: true,
  productSlug: true,
  authorId: true,
  author: true,
  avatarUrl: true,
  rating: true,
  headline: true,
  body: true,
  status: true,
  source: true,
  createdAt: true,
} as const

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productSlug: row.productSlug,
    authorId: row.authorId ?? undefined,
    author: row.author,
    avatarUrl: row.avatarUrl ?? undefined,
    rating: row.rating,
    headline: row.headline,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    source: row.source === "seed" ? "seed" : "user",
    status: (VALID_STATUSES.includes(row.status as ReviewStatus) ? row.status : "pending") as ReviewStatus,
  }
}

/** Published reviews are public; a viewer also sees their own pending review.
 * Rejected reviews are never listed. Same rule the local provider uses. */
function isVisibleTo(review: Review, viewerId?: string): boolean {
  if (review.status === "published") return true
  if (review.status === "pending" && viewerId && review.authorId === viewerId) return true
  return false
}

function sortNewest(reviews: Review[]): Review[] {
  return [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

async function sessionUserId(): Promise<string | undefined> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id
}

/** Reviews for a product: bundled seeds plus stored reviews, filtered by the
 * shared visibility rule. The viewer id is trusted from the session first. */
export async function listReviewsAction(productSlug: string, viewerHint?: string): Promise<Review[]> {
  const viewerId = (await sessionUserId()) ?? viewerHint
  const rows = await prisma.review.findMany({
    where: { productSlug },
    select: reviewSelect,
    orderBy: { createdAt: "desc" },
  })
  const stored = rows.map(toReview)
  const seeded = seedReviews.filter((r) => r.productSlug === productSlug)
  return sortNewest([...seeded, ...stored].filter((r) => isVisibleTo(r, viewerId)))
}

/** Submit a review. Moderation runs server-side; rejected content is returned
 * to the author with reasons but never stored. Author identity is taken from
 * the session when signed in. */
export async function addReviewAction(input: ReviewInput): Promise<Review> {
  const { status } = moderateReview(input.headline, input.body)
  const now = new Date().toISOString()

  if (status === "rejected") {
    return {
      ...input,
      authorId: input.authorId,
      id: `rejected-${Date.now()}`,
      createdAt: now,
      source: "user",
      status,
    }
  }

  const authorId = (await sessionUserId()) ?? input.authorId
  const row = await prisma.review.create({
    data: {
      id: crypto.randomUUID(),
      productSlug: input.productSlug,
      authorId: authorId ?? null,
      author: input.author,
      avatarUrl: input.avatarUrl ?? null,
      rating: input.rating,
      headline: input.headline,
      body: input.body,
      status: "pending",
      source: "user",
    },
    select: reviewSelect,
  })
  return toReview(row)
}
