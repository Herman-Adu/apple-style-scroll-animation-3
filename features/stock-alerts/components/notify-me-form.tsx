"use client"

import { useActionState } from "react"
import { Bell, Check } from "lucide-react"
import { subscribeStockAlertForm } from "../lib/actions/subscribe"
import type { StockAlertResult } from "../lib/domain/alert"

export function NotifyMeForm({ productSlug }: { productSlug: string }) {
  const [result, formAction, pending] = useActionState<StockAlertResult | null, FormData>(
    subscribeStockAlertForm,
    null,
  )

  if (result?.ok) {
    return (
      <p
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4 text-sm text-foreground/80"
      >
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
        {result.message}
      </p>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          Sold out. Tell me when it&apos;s back.
        </p>
        <p className="mt-1 text-sm text-foreground/60">One email, only when it returns. No marketing.</p>
      </div>
      <input type="hidden" name="productSlug" value={productSlug} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`notify-email-${productSlug}`} className="sr-only">
          Email address
        </label>
        <input
          id={`notify-email-${productSlug}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={result?.ok === false}
          aria-describedby={result?.ok === false ? `notify-error-${productSlug}` : undefined}
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Notify me"}
        </button>
      </div>
      {result?.ok === false && (
        <p id={`notify-error-${productSlug}`} role="alert" className="text-sm text-destructive">
          {result.error}
        </p>
      )}
    </form>
  )
}
