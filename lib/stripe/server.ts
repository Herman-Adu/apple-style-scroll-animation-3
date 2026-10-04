import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | undefined;

/**
 * Server-only Stripe client, created on first use. Slice indexes export "use server"
 * actions, so the checkout action module is loaded by every server page that imports
 * a slice; creating the client at import time would crash them all when
 * `STRIPE_SECRET_KEY` is unset. The installed `stripe` SDK pins its own API
 * version, so we intentionally don't override `apiVersion` here.
 */
export function getStripe(): Stripe {
  if (client) return client;
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    // Fail fast with a clear message rather than a cryptic Stripe SDK error deep
    // in a request.
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key (sk_test_…) in the project's environment variables.",
    );
  }
  client = new Stripe(key);
  return client;
}
