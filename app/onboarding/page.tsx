import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { OnboardingFlow } from "@/components/auth/onboarding-flow"

export const metadata: Metadata = {
  title: "Set up your profile",
}

export default function OnboardingPage() {
  return (
    <RouteGuard require="authenticated" redirectTo="/sign-in">
      <OnboardingFlow />
    </RouteGuard>
  )
}
