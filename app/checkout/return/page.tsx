import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle2, Clock } from "lucide-react"

import { stripe } from "@/lib/stripe/server"
import {
  finalizeCheckout,
  getOrderByStripeSession,
} from "@/lib/orders/checkout-finalize"
import { dispatchOrderEmails } from "@/lib/orders/order-notifications"
import { formatMoney } from "@/lib/format"
import { ClearCart } from "@/components/checkout/clear-cart"

export const dynamic = "force-dynamic"

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams
  if (!sessionId) redirect("/checkout")

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  // Still on the payment step (e.g. user navigated here early) → back to checkout.
  if (session.status === "open") redirect("/checkout")

  // The webhook normally creates the order first; fall back to finalizing here
  // so a confirmed payment always shows a confirmed order even if the webhook
  // is delayed. finalizeCheckout is idempotent.
  let order = await getOrderByStripeSession(session.id)
  if (!order && session.payment_status === "paid") {
    order = await finalizeCheckout(session)
    if (order) await dispatchOrderEmails(order)
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <ClearCart />
      {order ? (
        <>
          <CheckCircle2 className="size-14 text-[var(--accent,theme(colors.emerald.500))]" aria-hidden="true" />
          <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight">Thank you — your order is confirmed</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            {"We've emailed a receipt to "}
            <span className="text-foreground">{order.email}</span>. Your order reference is{" "}
            <span className="font-mono text-foreground">{order.number}</span>.
          </p>

          <div className="mt-8 w-full rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 text-left">
            <ul className="divide-y divide-foreground/10">
              {order.items.map((item) => (
                <li key={`${item.slug}-${item.color ?? ""}`} className="flex items-center justify-between py-3">
                  <span className="text-sm">
                    {item.name}
                    {item.color ? <span className="text-muted-foreground"> · {item.color}</span> : null}
                    <span className="text-muted-foreground"> × {item.quantity}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatMoney({ amount: item.unitAmount * item.quantity, currency: item.currency })}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-foreground/10 pt-4 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney({ amount: order.total, currency: order.currency })}</span>
            </div>
          </div>

          <Link
            href="/products"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Continue shopping
          </Link>
        </>
      ) : (
        <>
          <Clock className="size-14 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight">Your payment is processing</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            {"We're confirming your payment. This can take a moment — we'll email your receipt as soon as it's confirmed."}
          </p>
          <Link
            href="/account/orders"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full border border-foreground/15 px-6 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            View your orders
          </Link>
        </>
      )}
    </main>
  )
}
