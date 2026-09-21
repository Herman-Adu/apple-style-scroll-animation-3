"use client"

import { useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { reviewsProvider } from "@/lib/reviews/provider"
import type { Review } from "@/lib/reviews/types"
import { cn } from "@/lib/utils"

function RatingPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
          className="rounded-sm p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              star <= active ? "fill-white text-foreground" : "fill-transparent text-foreground/25",
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export function ReviewForm({
  productSlug,
  productName,
  onSubmitted,
}: {
  productSlug: string
  productName: string
  /** Called with the created review so the parent can reflect it in-session. */
  onSubmitted: (review: Review) => void
}) {
  const { user } = useAuth()

  const [rating, setRating] = useState(0)
  const [headline, setHeadline] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState<"pending" | null>(null)

  // Guests can't write reviews — invite them to sign in.
  if (!user) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
        <p className="text-sm text-foreground/60">
          Want to share your experience with {productName}?
        </p>
        <Link
          href="/sign-in"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
        >
          Sign in to write a review
        </Link>
      </div>
    )
  }

  if (done === "pending") {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-foreground/15 bg-foreground/5">
          <Star className="h-5 w-5 fill-white text-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Thanks for your review</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground/60">
          It&apos;s been submitted and is awaiting approval. You can see it below marked{" "}
          <span className="text-foreground/80">Pending</span> until our team publishes it.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])

    const nextErrors: string[] = []
    if (rating < 1) nextErrors.push("Please choose a star rating.")
    if (headline.trim().length < 3) nextErrors.push("Please add a short headline.")
    if (nextErrors.length > 0) {
      setErrors(nextErrors)
      return
    }

    setSubmitting(true)
    try {
      const review = await reviewsProvider.add({
        productSlug,
        authorId: user.id,
        author: user.profile?.displayName || user.name,
        avatarUrl: user.profile?.avatarUrl,
        rating,
        headline: headline.trim(),
        body: body.trim(),
      })

      if (review.status === "rejected") {
        // Moderation gate blocked it — show why, keep the draft for editing.
        const { moderateReview } = await import("@/lib/reviews/moderation")
        setErrors(moderateReview(headline.trim(), body.trim()).reasons)
        return
      }

      onSubmitted(review)
      setDone("pending")
    } catch {
      setErrors(["Something went wrong submitting your review. Please try again."])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8"
    >
      <h3 className="text-lg font-semibold text-foreground">Write a review</h3>
      <p className="mt-1 text-sm text-foreground/50">
        Signed in as {user.profile?.displayName || user.name}. Reviews are checked before they go live.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-[0.2em] text-foreground/40">Your rating</label>
          <RatingPicker value={rating} onChange={setRating} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="review-headline" className="text-xs uppercase tracking-[0.2em] text-foreground/40">
            Headline
          </label>
          <input
            id="review-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={80}
            placeholder="Sum up your experience"
            className="rounded-lg border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="review-body" className="text-xs uppercase tracking-[0.2em] text-foreground/40">
            Your review
          </label>
          <textarea
            id="review-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="What did you like? How do you use it?"
            className="resize-none rounded-lg border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
          />
        </div>

        {errors.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            {errors.map((error) => (
              <li key={error} className="text-xs text-red-200">
                {error}
              </li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  )
}
