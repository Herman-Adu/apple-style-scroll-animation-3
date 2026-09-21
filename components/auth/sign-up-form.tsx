"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AuthField } from "@/components/auth/auth-field"
import { AuthError, useAuth } from "@/lib/auth/auth-context"

export function SignUpForm() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setSubmitting(true)
    try {
      await signUp({ name, email, password })
      // New accounts always start onboarding.
      router.replace("/onboarding")
    } catch (err) {
      setError(err instanceof AuthError ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthField
        id="name"
        label="Full name"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Alex Rivera"
      />
      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
      />

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
      >
        {submitting ? <Spinner className="size-4" /> : "Create account"}
      </Button>
    </form>
  )
}
