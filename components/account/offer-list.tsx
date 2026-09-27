"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Sparkles, Tag } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { isOfferActive, offerDaysLeft } from "@/features/checkout/lib/pricing"
import { offerHeadline, offerUrgency } from "@/lib/offers/active-offer"
import type { OfferTag } from "@/lib/auth/types"

/** Human label for the offer kind, shown as a small caption on each card. */
function kindLabel(offer: OfferTag): string {
  switch (offer.kind) {
    case "percent":
      return "Percentage discount"
    case "shipping":
      return "Shipping"
    default:
      return "Personal offer"
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * The customer-facing view of their live personal offers on the account page.
 * Only offers that are still valid (`isOfferActive`) are shown — an expired
 * offer disappears here exactly as it stops discounting at checkout — so the
 * empty state doubles as the "your offers have ended" message. Redemption is
 * surfaced for transparency but never hides an offer; expiry is the single
 * gate, matching the checkout pricing engine.
 */
export function OfferList() {
  const { user } = useAuth()
  const offers = useMemo(
    () => (user?.offers ?? []).filter((offer) => isOfferActive(offer)),
    [user],
  )

  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/10 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
          <Tag className="h-6 w-6 text-foreground/40" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-base font-medium text-foreground">No offers at the moment</h3>
        <p className="mt-1 max-w-xs text-sm text-foreground/45">
          When we send you a personal offer it will appear here, ready to use at checkout.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  )
}

function OfferCard({ offer }: { offer: OfferTag }) {
  const deal = offerHeadline(offer)
  const ends = offerUrgency(offer)
  const days = offerDaysLeft(offer)
  const endingSoon = days !== null && days <= 3
  const redemptions = offer.redemptionCount ?? 0

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-teal/15 text-accent-teal">
          <Sparkles className="size-5" strokeWidth={1.5} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-teal px-2.5 py-0.5 text-xs font-bold tracking-wide text-background">
              {deal}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
              {kindLabel(offer)}
            </span>
          </div>

          <p className="mt-2 text-sm font-medium text-foreground">{offer.label}</p>
          {offer.note ? (
            <p className="mt-1 text-sm text-foreground/55">{offer.note}</p>
          ) : null}

          <p className="mt-2 text-sm text-foreground/55">
            Applied automatically at checkout — nothing to enter.
          </p>

          <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-foreground/10 pt-4 sm:grid-cols-2">
            <Detail label="Expires">
              {offer.expiresAt ? formatDate(offer.expiresAt) : "No expiry"}
            </Detail>
            <Detail label="Time left">
              {ends ? (
                <span className={endingSoon ? "font-semibold text-accent-teal" : undefined}>
                  {ends}
                </span>
              ) : (
                "Always available"
              )}
            </Detail>
            {redemptions > 0 ? (
              <Detail label="Times used">
                {redemptions === 1 ? "Once" : `${redemptions} times`}
              </Detail>
            ) : null}
            {offer.redeemedAt ? (
              <Detail label="Last used">{formatDate(offer.redeemedAt)}</Detail>
            ) : null}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">{label}</dt>
      <dd className="mt-1 text-sm text-foreground/80">{children}</dd>
    </div>
  )
}
