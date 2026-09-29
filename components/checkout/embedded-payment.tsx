"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

import { getStripe } from "@/lib/stripe/client"
import { startStripeCheckout, type QuoteRequestLine } from "@/features/checkout/actions"

/**
 * Mounts Stripe's embedded Checkout in the page. On mount, the provider calls
 * `fetchClientSecret` exactly once, which asks the server to price the cart,
 * reserve stock, and open a Checkout Session — returning its client secret.
 * Payment is captured inside Stripe's iframe; on completion Stripe redirects to
 * the session's return_url (/checkout/return).
 */
export function EmbeddedPayment({ lines }: { lines: QuoteRequestLine[] }) {
  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await startStripeCheckout({ lines })
    return clientSecret
  }, [lines])

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-1">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
