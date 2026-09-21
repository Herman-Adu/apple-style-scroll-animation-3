import type { Metadata } from "next"
import Link from "next/link"
import { RouteGuard } from "@/components/auth/route-guard"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = {
  title: "Create account",
}

export default function SignUpPage() {
  return (
    <RouteGuard require="unauthenticated" redirectTo="/account">
      <AuthShell
        eyebrow="Get started"
        title="Create your account"
        subtitle="A few details and you'll be listening in no time."
        footer={
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <SignUpForm />
      </AuthShell>
    </RouteGuard>
  )
}
