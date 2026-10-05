"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { getStripe } from "@/lib/stripe/client";
import {
  startStripeCheckout,
  type QuoteRequestLine,
} from "@/features/checkout";

// Stripe always bootstraps with these two utility iframes (telemetry + outer
// controller), appended straight to <body> before the real checkout content
// iframe exists. Anything beyond them is the actual UI landing.
const STRIPE_BOOTSTRAP_IFRAME_COUNT = 2;

/**
 * Mounts Stripe's embedded Checkout in the page. On mount, the provider calls
 * `fetchClientSecret` exactly once, which asks the server to price the cart,
 * reserve stock, and open a Checkout Session — returning its client secret.
 * Payment is captured inside Stripe's iframe; on completion Stripe redirects to
 * the session's return_url (/checkout/return).
 *
 * Embedded Checkout's own contents render inside a cross-origin Stripe iframe,
 * which does not accept the Appearance API — Stripe only opens that up to a
 * fully custom Elements/PaymentIntent form, which would mean rebuilding the
 * webhook + order-finalization path this checkout already relies on. Instead,
 * the brand is expressed in everything we do own: the card shell, the teal
 * accent bar, the themed loading skeleton, and the "secured by Stripe" mark
 * below — all driven by the site's own design tokens, so they follow light/
 * dark mode automatically.
 */
export function EmbeddedPayment({
  lines,
  code,
}: {
  lines: QuoteRequestLine[];
  code?: string;
}) {
  const [ready, setReady] = useState(() => {
    if (typeof document === "undefined") return false;
    return (
      document.querySelectorAll("iframe").length > STRIPE_BOOTSTRAP_IFRAME_COUNT
    );
  });

  const fetchClientSecret = useCallback(async () => {
    const { clientSecret } = await startStripeCheckout({ lines, code });
    return clientSecret;
  }, [lines, code]);

  // EmbeddedCheckout exposes no "ready" callback, and Stripe appends every
  // one of its iframes straight to <body> rather than inside our own DOM
  // subtree, so watch body for the real content iframe landing alongside
  // Stripe's bootstrap frames and swap the branded skeleton for it then.
  useEffect(() => {
    if (ready) return;
    const observer = new MutationObserver(() => {
      if (
        document.querySelectorAll("iframe").length >
        STRIPE_BOOTSTRAP_IFRAME_COUNT
      ) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-card shadow-sm">
        <div className="h-1 w-full bg-accent-teal" aria-hidden="true" />
        <div className={`relative p-1 ${ready ? "" : "min-h-[520px]"}`}>
          {!ready && (
            <div
              className="absolute inset-1 flex flex-col gap-3 rounded-xl bg-card p-6"
              aria-hidden="true"
            >
              <div className="h-4 w-1/3 animate-pulse rounded-full bg-foreground/10" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-foreground/5" />
              <div className="h-4 w-1/4 animate-pulse rounded-full bg-foreground/10" />
              <div className="h-11 w-full animate-pulse rounded-lg bg-foreground/5" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-full bg-accent-teal/20" />
            </div>
          )}
          <EmbeddedCheckoutProvider
            stripe={getStripe()}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-foreground/40">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
        Payment secured by Stripe. Momo Audio never sees your card details.
      </p>
    </div>
  );
}
