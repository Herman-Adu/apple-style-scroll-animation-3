import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { RouteGuard } from "@/components/auth/route-guard"
import { SignInForm } from "@/components/auth/sign-in-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Sign in",
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/account"

  return (
    <RouteGuard require="unauthenticated" redirectTo={safeRedirect}>
      <AuthShell
        eyebrow="Welcome back"
        title="Sign in to your account"
        subtitle="Access your profile, orders, and personalized sound."
        footer={
          <>
            New here?{" "}
            <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </AuthShell>
    </RouteGuard>
  )
}
