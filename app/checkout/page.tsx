import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { CheckoutView } from "@/components/checkout/checkout-view"

export const metadata: Metadata = {
  title: "Checkout",
}

export default function CheckoutPage() {
  return (
    <RouteGuard require="authenticated" redirectTo="/sign-in?redirect=/checkout">
      <CheckoutView />
    </RouteGuard>
  )
}
