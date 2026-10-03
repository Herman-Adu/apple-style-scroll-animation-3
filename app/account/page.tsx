import type { Metadata } from "next"
import { Suspense } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AccountView } from "@/components/account/account-view"
import { listMyOrdersAction } from "@/features/orders/server"

export const metadata: Metadata = {
  title: "Your account",
}

export default function AccountPage() {
  const ordersPromise = listMyOrdersAction()
  return (
    <RouteGuard require="authenticated" redirectTo="/sign-in" requireOnboarded>
      <Suspense fallback={null}>
        <AccountView ordersPromise={ordersPromise} />
      </Suspense>
    </RouteGuard>
  )
}
