"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth/adapters/auth-context"

/**
 * Controlled confirmation before signing out of the storefront account. A
 * stray tap on the sign-out affordance shouldn't end the session, so every
 * sign-out entry point (account page, header menu, mobile nav) routes
 * through this dialog rather than calling signOut directly.
 */
export function SignOutConfirmDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signOut } = useAuth()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    await signOut()
    // Hard navigation home so a guarded page's RouteGuard can't intercept
    // the now-unauthenticated session and bounce us to /sign-in mid-transition.
    window.location.replace("/")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            {"You'll need to sign back in to view your orders, offers, and profile."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              confirm()
            }}
            disabled={busy}
            className="bg-foreground text-background hover:bg-foreground/90"
          >
            <LogOut className="mr-2 size-4" aria-hidden />
            {busy ? "Signing out…" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
