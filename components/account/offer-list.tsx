"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Tag, X } from "lucide-react";
import { useAuth } from "@/lib/auth/adapters/auth-context";
import { offerDaysLeft } from "@/features/checkout";
import { offerHeadline, offerUrgency } from "@/features/checkout";
import type { OfferTag } from "@/lib/auth/domain/types";

/**
 * How long a used or expired offer keeps showing on the account page after it
 * stops being redeemable, so the customer gets a reminder instead of it
 * vanishing the instant it's spent. A used offer with its own `expiresAt`
 * shows until that date passes instead (its natural "time slot"); this grace
 * period only fills in when there's no such date to lean on.
 */
const GRACE_DAYS = 7;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

type OfferDisplayState = "active" | "used" | "expired" | "hidden";

/**
 * Where an offer sits on the account page. Distinct from `isOfferActive`
 * (the checkout eligibility gate): a used or expired offer keeps a card here
 * for a while as a reminder/receipt before it disappears, either because the
 * customer dismissed it or its grace window ran out.
 */
function offerDisplayState(
  offer: OfferTag,
  now: number = Date.now(),
): OfferDisplayState {
  if (offer.dismissedAt) return "hidden";

  const cap = offer.maxRedemptions ?? 1;
  const usedUp = (offer.redemptionCount ?? 0) >= cap;
  const expiry = offer.expiresAt ? new Date(offer.expiresAt).getTime() : null;
  const pastExpiry = expiry !== null && !Number.isNaN(expiry) && expiry <= now;

  if (!usedUp && !pastExpiry) return "active";

  if (usedUp) {
    const redeemed = offer.redeemedAt
      ? new Date(offer.redeemedAt).getTime()
      : now;
    const windowEnd =
      expiry !== null && !Number.isNaN(expiry) ? expiry : redeemed + GRACE_MS;
    return now <= windowEnd ? "used" : "hidden";
  }

  // Expired without ever being used.
  const graceEnd = (expiry ?? now) + GRACE_MS;
  return now <= graceEnd ? "expired" : "hidden";
}

/** Human label for the offer kind, shown as a small caption on each card. */
function kindLabel(offer: OfferTag): string {
  switch (offer.kind) {
    case "percent":
      return "Percentage discount";
    case "shipping":
      return "Shipping";
    default:
      return "Personal offer";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * The customer-facing view of their personal offers on the account page.
 * Shows three states: still-usable offers as before, plus a muted "used" or
 * "expired" reminder card once an offer stops discounting at checkout — so a
 * spent one-time offer doesn't just silently vanish. Each of those reminder
 * cards can be closed early; otherwise they clear themselves automatically
 * once their grace window passes. Checkout eligibility itself is unaffected
 * by any of this — it's governed entirely by the pricing engine.
 */
export function OfferList() {
  const { user } = useAuth();
  const [now] = useState(() => Date.now());
  const visible = useMemo(() => {
    return (user?.offers ?? [])
      .map((offer) => ({ offer, state: offerDisplayState(offer, now) }))
      .filter((entry) => entry.state !== "hidden") as {
      offer: OfferTag;
      state: Exclude<OfferDisplayState, "hidden">;
    }[];
  }, [user, now]);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/10 px-6 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
          <Tag className="h-6 w-6 text-foreground/40" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-base font-medium text-foreground">
          No offers at the moment
        </h3>
        <p className="mt-1 max-w-xs text-sm text-foreground/45">
          When we send you a personal offer it will appear here, ready to use at
          checkout.
        </p>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {visible.map(({ offer, state }) => (
        <OfferCard key={offer.id} offer={offer} state={state} />
      ))}
    </div>
  );
}

function OfferCard({
  offer,
  state,
}: {
  offer: OfferTag;
  state: "active" | "used" | "expired";
}) {
  const { dismissOffer } = useAuth();
  const [dismissing, setDismissing] = useState(false);
  const deal = offerHeadline(offer);
  const ends = offerUrgency(offer);
  const days = offerDaysLeft(offer);
  const endingSoon = state === "active" && days !== null && days <= 3;
  const redemptions = offer.redemptionCount ?? 0;
  const spent = state !== "active";

  async function handleDismiss() {
    setDismissing(true);
    try {
      await dismissOffer(offer.id);
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div
      className={`relative rounded-2xl border p-5 ${
        spent
          ? "border-foreground/10 bg-foreground/[0.015]"
          : "border-foreground/10 bg-foreground/[0.03]"
      }`}
    >
      {spent ? (
        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss offer"
          className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}

      <div className="flex items-start gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
            spent
              ? "bg-foreground/10 text-foreground/40"
              : "bg-accent-teal/15 text-accent-teal"
          }`}
        >
          <Sparkles className="size-5" strokeWidth={1.5} aria-hidden />
        </span>

        <div className="min-w-0 flex-1 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${
                spent
                  ? "bg-foreground/10 text-foreground/60"
                  : "bg-accent-teal text-background"
              }`}
            >
              {state === "used"
                ? "Used"
                : state === "expired"
                  ? "Expired"
                  : deal}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
              {kindLabel(offer)}
            </span>
            {spent ? (
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/30">
                {deal}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm font-medium text-foreground">
            {offer.label}
          </p>
          {offer.note ? (
            <p className="mt-1 text-sm text-foreground/55">{offer.note}</p>
          ) : null}

          {state === "active" ? (
            <p className="mt-2 text-sm text-foreground/55">
              Applied automatically at checkout — nothing to enter.
            </p>
          ) : state === "used" ? (
            <p className="mt-2 text-sm text-foreground/55">
              This one-time offer has already been used and no longer applies at
              checkout.
            </p>
          ) : (
            <p className="mt-2 text-sm text-foreground/55">
              This offer has expired and is no longer available.
            </p>
          )}

          <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-foreground/10 pt-4 sm:grid-cols-2">
            <Detail label="Expires">
              {offer.expiresAt ? formatDate(offer.expiresAt) : "No expiry"}
            </Detail>
            {state === "active" ? (
              <Detail label="Time left">
                {ends ? (
                  <span
                    className={
                      endingSoon ? "font-semibold text-accent-teal" : undefined
                    }
                  >
                    {ends}
                  </span>
                ) : (
                  "Always available"
                )}
              </Detail>
            ) : null}
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
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.2em] text-foreground/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground/80">{children}</dd>
    </div>
  );
}
