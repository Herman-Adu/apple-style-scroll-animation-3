import { loadStripe, type Stripe } from "@stripe/stripe-js"

import { env } from "@/lib/env"

let stripePromise: Promise<Stripe | null> | null = null

/**
 * Singleton Stripe.js loader for the browser. Stripe.js must be loaded once and
 * reused; calling this repeatedly returns the same promise. Uses the publishable
 * key (pk_test_… for this prototype), which is safe to expose to the client.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")
  }
  return stripePromise
}
