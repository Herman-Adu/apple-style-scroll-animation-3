import { cn } from "@/lib/utils"
import type { OfferTag, UserRole, UserStatus } from "@/lib/auth/types"
import { isOfferActive, offerDaysLeft } from "@/features/checkout/lib/pricing"

const STATUS_TONE: Record<UserStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  blocked: "border-red-500/30 bg-red-500/10 text-red-500",
}

export function CustomerStatusBadge({ status = "active" }: { status?: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        STATUS_TONE[status],
      )}
    >
      {status}
    </span>
  )
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        role === "admin"
          ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
          : "border-border bg-foreground/5 text-muted-foreground",
      )}
    >
      {role}
    </span>
  )
}

/** Human summary of an offer tag, e.g. "15% off" or "Free shipping". */
export function offerSummary(offer: OfferTag): string {
  switch (offer.kind) {
    case "percent":
      return `${offer.value ?? 0}% off`
    case "shipping":
      return "Free shipping"
    case "custom":
    default:
      return offer.label
  }
}

/** Short expiry status shown on an offer chip, e.g. "expires today", "3d left". */
function offerExpiryLabel(offer: OfferTag): string | null {
  const days = offerDaysLeft(offer)
  if (days === null) return null
  if (days < 0) return "expired"
  if (days === 0) return "expires today"
  if (days === 1) return "1d left"
  return `${days}d left`
}

export function OfferChip({ offer, onRemove }: { offer: OfferTag; onRemove?: () => void }) {
  const active = isOfferActive(offer)
  const expiry = offerExpiryLabel(offer)
  const redeemed = (offer.redemptionCount ?? 0) > 0

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-2.5 pr-1 text-xs font-medium",
        active
          ? "border-accent-teal/30 bg-accent-teal/10 text-accent-teal"
          : "border-border bg-foreground/5 text-muted-foreground line-through",
      )}
    >
      <span>{offer.label}</span>
      {expiry ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-px text-[10px] font-normal no-underline",
            active ? "bg-accent-teal/15" : "bg-foreground/10",
          )}
        >
          {expiry}
        </span>
      ) : null}
      {redeemed ? (
        <span
          className="rounded-full bg-emerald-500/15 px-1.5 py-px text-[10px] font-normal text-emerald-500 no-underline"
          title={offer.redeemedAt ? `Last used ${new Date(offer.redeemedAt).toLocaleDateString()}` : undefined}
        >
          used{(offer.redemptionCount ?? 0) > 1 ? ` ${offer.redemptionCount}×` : ""}
        </span>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove offer ${offer.label}`}
          className={cn(
            "flex size-4 items-center justify-center rounded-full no-underline transition-colors",
            active
              ? "text-accent-teal/70 hover:bg-accent-teal/20 hover:text-accent-teal"
              : "text-muted-foreground/70 hover:bg-foreground/10 hover:text-foreground",
          )}
        >
          ×
        </button>
      ) : null}
    </span>
  )
}
