// Shared carrier metadata + tracking-URL helper. Pure and client-safe (no
// "server-only") so both the admin form and the customer-facing order card
// can render carrier labels without round-tripping to the server.

export type Carrier = "ups" | "usps" | "fedex" | "dhl" | "other"

export const CARRIERS: { value: Carrier; label: string }[] = [
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
]

export function carrierLabel(carrier?: string | null): string {
  return CARRIERS.find((c) => c.value === carrier)?.label ?? "Carrier"
}

/**
 * Best-effort public tracking-page URL for a known carrier. "other" has no
 * template — callers must supply `trackingUrl` directly for that case, which
 * is why this returns `undefined` rather than a guess.
 */
export function buildTrackingUrl(carrier: Carrier, trackingNumber: string): string | undefined {
  const n = encodeURIComponent(trackingNumber)
  switch (carrier) {
    case "ups":
      return `https://www.ups.com/track?loc=en_US&tracknum=${n}`
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${n}`
    default:
      return undefined
  }
}
