import "server-only"

import Stripe from "stripe"

import { env } from "@/lib/env"

const key = env.STRIPE_SECRET_KEY

if (!key) {
  // Fail fast with a clear message rather than a cryptic Stripe SDK error deep
  // in a request. Only the checkout action, webhook, and return page import
  // this module, so the rest of the app is unaffected until payments are used.
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key (sk_test_…) in the project's environment variables.",
  )
}

/**
 * Server-only Stripe client. The installed `stripe` SDK pins its own API
 * version, so we intentionally don't override `apiVersion` here.
 */
export const stripe = new Stripe(key)
