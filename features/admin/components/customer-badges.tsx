import { cn } from "@/lib/utils"
import type { OfferTag, UserRole, UserStatus } from "@/lib/auth/types"

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

export function OfferChip({ offer, onRemove }: { offer: OfferTag; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-teal/30 bg-accent-teal/10 py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent-teal">
      <span>{offer.label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove offer ${offer.label}`}
          className="flex size-4 items-center justify-center rounded-full text-accent-teal/70 transition-colors hover:bg-accent-teal/20 hover:text-accent-teal"
        >
          ×
        </button>
      ) : null}
    </span>
  )
}
