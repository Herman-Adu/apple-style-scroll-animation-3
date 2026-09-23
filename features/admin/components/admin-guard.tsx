"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"

/**
 * Client gate for the admin area. Renders children only for an authenticated
 * user whose role is `admin`; everyone else is redirected. Pre-Strapi the role
 * comes from the seeded admin allowlist resolved in the auth adapter.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth()
  const router = useRouter()
  const isAdmin = status === "authenticated" && user?.role === "admin"

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/sign-in?redirect=/admin")
      return
    }
    if (user?.role !== "admin") {
      router.replace("/")
    }
  }, [status, user, router])

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
          role="status"
          aria-label="Loading admin"
        />
      </div>
    )
  }

  return <>{children}</>
}
