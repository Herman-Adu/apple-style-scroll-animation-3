"use client"

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { personalOfferEmail } from "@/features/email/templates"
import type { OfferTag } from "@/lib/auth/types"

/** The offer fields the branded email actually renders. */
export type PreviewOffer = Pick<OfferTag, "label" | "kind" | "value" | "expiresAt" | "note">

/**
 * Renders the exact branded personal-offer email — the same pure template the
 * server sends — inside a sandboxed iframe so the admin can see precisely what
 * the customer receives before sending or re-sending. No network round-trip:
 * the template is pure, so the preview is instant and always in sync.
 */
export function OfferEmailPreview({
  open,
  onOpenChange,
  offer,
  customerName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offer: PreviewOffer | null
  customerName: string
}) {
  const rendered = useMemo(() => {
    if (!offer) return null
    const shopUrl = typeof window !== "undefined" ? `${window.location.origin}/products` : "/products"
    return personalOfferEmail({
      name: customerName || "there",
      offer: {
        label: offer.label || "Special offer",
        kind: offer.kind,
        value: offer.value,
        expiresAt: offer.expiresAt,
        note: offer.note,
      },
      shopUrl,
    })
  }, [offer, customerName])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border p-4 text-left">
          <DialogTitle className="text-sm">Email preview</DialogTitle>
          <DialogDescription className="truncate text-xs">
            Subject: <span className="text-foreground">{rendered?.subject ?? "—"}</span>
          </DialogDescription>
        </DialogHeader>
        {rendered ? (
          <iframe
            title="Branded offer email preview"
            srcDoc={rendered.html}
            className="h-[540px] w-full border-0 bg-white"
            sandbox=""
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
