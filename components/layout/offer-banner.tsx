"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { isOfferActive, offerDaysLeft } from "@/features/checkout/lib/pricing"
import type { OfferTag } from "@/lib/auth/types"

/** Headline describing an offer's benefit, e.g. "10% off" or "Free shipping". */
function headline(offer: OfferTag): string {
  switch (offer.kind) {
    case "percent":
      return `${offer.value ?? 0}% off`
    case "shipping":
      return "Free shipping"
    default:
      return offer.label
  }
}

/** Gentle urgency copy from the days remaining, or null when the offer never expires. */
function urgency(offer: OfferTag): string | null {
  const days = offerDaysLeft(offer)
  if (days === null) return null
  if (days <= 0) return "ends today"
  if (days === 1) return "ends tomorrow"
  return `${days} days left`
}

/**
 * Prefer the best percent offer (matches the checkout's no-stacking rule), then
 * any active offer, so the banner advertises exactly what the customer will get.
 */
function pickOffer(offers: OfferTag[]): OfferTag | null {
  const active = offers.filter((o) => isOfferActive(o))
  if (active.length === 0) return null
  const percents = active.filter((o) => o.kind === "percent" && (o.value ?? 0) > 0)
  if (percents.length > 0) {
    return percents.reduce((best, o) => ((o.value ?? 0) > (best.value ?? 0) ? o : best))
  }
  return active[0]
}

/**
 * Slim promotional banner shown to a signed-in customer who has a live personal
 * offer. Reminds them the deal applies automatically at checkout and links to
 * the shop. Dismissible for the session (per offer), so it never nags.
 */
export function OfferBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const offer = useMemo(() => pickOffer(user?.offers ?? []), [user])

  if (!offer || dismissed) return null

  const deal = headline(offer)
  const ends = urgency(offer)

  return (
    <div className="relative bg-foreground text-background">
      <Link
        href="/products"
        className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-sm"
      >
        <span className="font-semibold">{deal}</span>
        <span className="text-background/70">·</span>
        <span className="text-background/80">
          A personal offer, applied automatically at checkout
        </span>
        {ends ? (
          <span className="hidden rounded-full bg-background/15 px-2 py-0.5 text-xs font-medium sm:inline">
            {ends}
          </span>
        ) : null}
        <span className="font-medium underline underline-offset-2">Shop now</span>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setDismissed(true)
        }}
        aria-label="Dismiss offer"
        className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-background/60 transition-colors hover:bg-background/15 hover:text-background"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
