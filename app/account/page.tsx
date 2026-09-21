import type { Metadata } from "next"
import { Suspense } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AccountView } from "@/components/account/account-view"

export const metadata: Metadata = {
  title: "Your account",
}

export default function AccountPage() {
  return (
    <RouteGuard require="authenticated" redirectTo="/sign-in" requireOnboarded>
      <Suspense fallback={null}>
        <AccountView />
      </Suspense>
    </RouteGuard>
  )
}
