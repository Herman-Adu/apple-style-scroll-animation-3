"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { offerHeadline, offerUrgency, pickActiveOffer } from "@/lib/offers/active-offer"

/**
 * Slim promotional bar for a signed-in customer with a live personal offer.
 * Rendered inside the fixed header stack (see SiteChrome) so it sits directly
 * *under* the navigation and never overlaps it. Dismissible for the session.
 */
export function OfferBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const offer = useMemo(() => pickActiveOffer(user?.offers ?? []), [user])

  if (!offer || dismissed) return null

  const deal = offerHeadline(offer)
  const ends = offerUrgency(offer)

  return (
    <div className="relative border-b border-background/10 bg-foreground text-background">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 px-12 py-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-background/15">
            <Sparkles className="size-3" strokeWidth={2} aria-hidden />
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-bold tracking-wide text-foreground">
            {deal}
          </span>
        </span>
        <span className="hidden text-background/75 sm:inline">
          A personal offer for you, applied automatically at checkout
        </span>
        {ends ? (
          <span className="hidden rounded-full bg-background/15 px-2 py-0.5 text-xs font-medium sm:inline">
            {ends}
          </span>
        ) : null}
        <Link
          href="/products"
          className="group inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
        >
          Shop now
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offer"
        className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-background/60 transition-colors hover:bg-background/15 hover:text-background"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
