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
import { useAuth } from "@/lib/auth/auth-context"

/**
 * Controlled confirmation before signing out. Sign-out is destructive enough
 * (loses the admin session) that a stray tap shouldn't trigger it — so every
 * sign-out affordance across the admin chrome routes through this dialog.
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
    // Hard navigation home so the admin RouteGuard can't intercept the now-
    // unauthenticated session and bounce us to /sign-in mid-transition.
    window.location.replace("/")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of the admin dashboard?</AlertDialogTitle>
          <AlertDialogDescription>
            {"You'll be returned to the storefront and will need to sign back in to manage the store."}
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
            className="bg-accent-teal text-background hover:bg-accent-teal/90"
          >
            <LogOut className="mr-2 size-4" aria-hidden />
            {busy ? "Signing out…" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
