import type Stripe from "stripe"

import { stripe } from "@/lib/stripe/server"
import { env } from "@/lib/env"
import {
  finalizeCheckout,
  releaseCheckout,
} from "@/lib/orders/checkout-finalize"
import { dispatchOrderEmails } from "@/lib/orders/order-notifications"

// Stripe needs the raw, unparsed body to verify the signature, and the Node
// crypto used by constructEvent — so pin the Node runtime and read req.text().
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe webhook is not configured.", { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) return new Response("Missing stripe-signature header.", { status: 400 })

  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.log("[v0] stripe webhook signature verification failed:", (err as Error).message)
    return new Response("Invalid signature.", { status: 400 })
  }

  try {
    switch (event.type) {
      // Payment confirmed (card + most methods). Materialize the order.
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.payment_status === "paid") {
          const order = await finalizeCheckout(session)
          if (order) await dispatchOrderEmails(order)
        }
        break
      }
      // Abandoned or failed — restore the reserved stock.
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session
        await releaseCheckout(session)
        break
      }
    }
  } catch (err) {
    // Return 500 so Stripe retries a transient failure.
    console.log("[v0] stripe webhook handler error:", (err as Error).message)
    return new Response("Webhook handler error.", { status: 500 })
  }

  return new Response(null, { status: 200 })
}
