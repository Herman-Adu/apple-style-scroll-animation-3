"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/auth/auth-context"

type Requirement = "authenticated" | "unauthenticated"

/**
 * Client-side gate. Keeps auth routing declarative: each page states the session
 * it requires and where to send users who don't match. Onboarding-incomplete users
 * are funneled to /onboarding from any protected page.
 */
export function RouteGuard({
  require,
  redirectTo,
  requireOnboarded = false,
  children,
}: {
  require: Requirement
  redirectTo: string
  requireOnboarded?: boolean
  children: React.ReactNode
}) {
  const { status, user } = useAuth()
  const router = useRouter()

  const needsOnboarding =
    requireOnboarded && status === "authenticated" && user?.onboardingStatus !== "complete"

  const mismatch =
    (require === "authenticated" && status === "unauthenticated") ||
    (require === "unauthenticated" && status === "authenticated")

  useEffect(() => {
    if (status === "loading") return
    if (mismatch) {
      router.replace(redirectTo)
      return
    }
    if (needsOnboarding) router.replace("/onboarding")
  }, [status, mismatch, needsOnboarding, redirectTo, router])

  if (status === "loading" || mismatch || needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="size-6 text-foreground/60" />
      </div>
    )
  }

  return <>{children}</>
}
