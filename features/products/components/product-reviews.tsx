"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { reviewsProvider, summarize } from "@/lib/reviews/provider"
import type { Review, ReviewSummary } from "@/lib/reviews/types"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { ReviewForm } from "./review-form"
import { cn } from "@/lib/utils"

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i < Math.round(value) ? "fill-white text-foreground" : "fill-transparent text-foreground/25",
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function ProductReviews({
  productSlug,
  productName,
}: {
  productSlug: string
  productName: string
}) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [summary, setSummary] = useState<ReviewSummary | null>(null)

  useEffect(() => {
    let active = true
    reviewsProvider
      .list(productSlug, user?.id)
      .then((list) => {
        if (!active) return
        setReviews(list)
        // Public rating summary reflects published reviews only.
        setSummary(summarize(list.filter((r) => r.status === "published")))
      })
      .catch(() => {
        if (!active) return
        setReviews([])
        setSummary(summarize([]))
      })
    return () => {
      active = false
    }
  }, [productSlug, user?.id])

  function handleSubmitted(review: Review) {
    // Reflect the author's own pending review immediately, in-session.
    setReviews((prev) => [review, ...(prev ?? [])])
  }

  const publishedReviews = reviews?.filter((r) => r.status === "published") ?? []
  const pendingReviews = reviews?.filter((r) => r.status === "pending") ?? []

  return (
    <section className="relative z-10 border-t border-foreground/10 px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-foreground/40">Owner reviews</span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
            What people say about {productName}
          </h2>
        </div>

        {summary && summary.count > 0 ? (
          <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
            {/* Summary */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    {summary.average.toFixed(1)}
                  </span>
                  <span className="text-sm text-foreground/40">out of 5</span>
                </div>
                <div className="mt-3">
                  <Stars value={summary.average} size={18} />
                </div>
                <p className="mt-3 text-sm text-foreground/50">
                  Based on {summary.count} review{summary.count === 1 ? "" : "s"}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const n = summary.distribution[star - 1]
                    const pct = summary.count ? (n / summary.count) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="w-3 text-right text-xs text-foreground/50">{star}</span>
                        <Star className="h-3 w-3 fill-white/40 text-foreground/40" strokeWidth={0} />
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                          <span
                            className="block h-full rounded-full bg-foreground/70"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span className="w-6 text-right text-xs tabular-nums text-foreground/40">{n}</span>
                      </div>
                    )
                  })}
                </div>

                <p className="mt-8 text-xs leading-relaxed text-foreground/40">
                  Reviews are moderated before they appear publicly.
                </p>
              </div>
            </div>

            {/* List + write form */}
            <div className="flex flex-col gap-10">
              <ul className="flex flex-col divide-y divide-foreground/5">
                {pendingReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} pending />
                ))}
                {publishedReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </ul>

              <ReviewForm
                productSlug={productSlug}
                productName={productName}
                onSubmitted={handleSubmitted}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-12 text-center lg:sticky lg:top-28 lg:self-start">
              <Stars value={0} size={20} />
              <p className="mt-4 text-sm text-foreground/50">
                {summary === null
                  ? "Loading reviews…"
                  : `No reviews yet for ${productName}. Be the first to share your experience.`}
              </p>
            </div>
            <div className="flex flex-col gap-10">
              {pendingReviews.length > 0 && (
                <ul className="flex flex-col divide-y divide-foreground/5">
                  {pendingReviews.map((review) => (
                    <ReviewItem key={review.id} review={review} pending />
                  ))}
                </ul>
              )}
              <ReviewForm
                productSlug={productSlug}
                productName={productName}
                onSubmitted={handleSubmitted}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function ReviewItem({ review, pending = false }: { review: Review; pending?: boolean }) {
  return (
    <li className="flex flex-col gap-3 py-7 first:pt-0">
      <div className="flex items-center gap-3">
        <UserAvatar name={review.author} src={review.avatarUrl} size={40} />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{review.author}</span>
          <span className="text-xs text-foreground/40">{formatDate(review.createdAt)}</span>
        </div>
        {pending && (
          <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-200">
            Pending approval
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Stars value={review.rating} />
        <h3 className="text-sm font-semibold text-foreground">{review.headline}</h3>
      </div>
      {review.body && <p className="text-sm leading-relaxed text-foreground/60">{review.body}</p>}
    </li>
  )
}
