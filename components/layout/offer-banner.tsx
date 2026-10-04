"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, X } from "lucide-react"
import { useAuth } from "@/lib/auth/adapters/auth-context"
import { offerHeadline, offerUrgency, pickActiveOffer } from "@/features/checkout"

/**
 * Slim promotional bar for a signed-in customer with a live personal offer.
 * Rendered at the top of the fixed header stack (see SiteChrome) so it sits
 * *above* the navigation — keeping the nav docked against the page content
 * below it. Adopts the navbar's frosted-glass material and the teal brand
 * accent so it reads as one piece of chrome in both themes. Dismissible.
 */
export function OfferBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const offer = useMemo(() => pickActiveOffer(user?.offers ?? []), [user])

  if (!offer || dismissed) return null

  const deal = offerHeadline(offer)
  const ends = offerUrgency(offer)

  return (
    <div className="relative border-b border-foreground/10 bg-background/80 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 px-12 py-2 text-sm">
        <span className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
            <Sparkles className="size-3" strokeWidth={2} aria-hidden />
          </span>
          <span className="rounded-full bg-accent-teal px-2 py-0.5 text-xs font-bold tracking-wide text-background">
            {deal}
          </span>
        </span>
        <span className="hidden text-foreground/60 sm:inline">
          A personal offer for you, applied automatically at checkout
        </span>
        {ends ? (
          <span className="hidden rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/70 sm:inline">
            {ends}
          </span>
        ) : null}
        <Link
          href="/products"
          className="group inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 transition-colors hover:text-accent-teal hover:underline"
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
        className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-accent-teal/12 hover:text-accent-teal"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
