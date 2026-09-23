"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, LogOut, Package, Settings, UserRound } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { SignOutConfirmDialog } from "./sign-out-confirm"

/**
 * Shared admin account dropdown — used by both the header avatar and the
 * sidebar footer profile row. Groups the storefront link, profile/settings
 * navigation, a theme toggle (the only theme control in the admin chrome on
 * desktop), and a guarded sign-out that opens a confirmation dialog.
 */
export function AdminAccountMenu({
  children,
  align = "end",
  side = "bottom",
}: {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
}) {
  const { user } = useAuth()
  const [signOutOpen, setSignOutOpen] = useState(false)

  if (!user) return null

  const displayName = user.profile.displayName || user.name

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          side={side}
          sideOffset={10}
          className="w-64 rounded-2xl border-border/70 bg-popover/80 p-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150"
        >
          <div className="flex items-center gap-3 px-2 pb-2 pt-1">
            <UserAvatar name={displayName} src={user.profile.avatarUrl} size={40} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
            </span>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2.5">
            <Link href="/account">
              <UserRound className="size-4" strokeWidth={1.5} aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2.5">
            <Link href="/account?tab=orders">
              <Package className="size-4" strokeWidth={1.5} aria-hidden />
              Orders &amp; invoices
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2.5">
            <Link href="/admin/settings">
              <Settings className="size-4" strokeWidth={1.5} aria-hidden />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-3 rounded-xl px-2 py-2.5">
            <Link href="/">
              <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden />
              Storefront
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-3 rounded-xl px-2 py-2.5 focus:bg-destructive/10 focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault()
              setSignOutOpen(true)
            }}
          >
            <LogOut className="size-4" strokeWidth={1.5} aria-hidden />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutConfirmDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  )
}
