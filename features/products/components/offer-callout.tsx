"use client"

import { useMemo } from "react"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth/adapters/auth-context"
import { offerHeadline, offerUrgency, pickActiveOffer } from "@/features/checkout"

/**
 * Inline reminder on the products page for a signed-in customer who has a live
 * personal offer, so the discount is visible while they shop. Renders nothing
 * for everyone else.
 */
export function ProductsOfferCallout() {
  const { user } = useAuth()
  const offer = useMemo(() => pickActiveOffer(user?.offers ?? []), [user])
  if (!offer) return null

  const deal = offerHeadline(offer)
  const ends = offerUrgency(offer)

  return (
    <div className="mt-8 flex items-center gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Sparkles className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          <span>Your personal offer</span>
          <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-bold text-background">{deal}</span>
        </p>
        <p className="mt-0.5 text-sm text-foreground/55">
          {`Applied automatically at checkout — nothing to enter${ends ? ` · ${ends}` : ""}.`}
        </p>
      </div>
    </div>
  )
}
