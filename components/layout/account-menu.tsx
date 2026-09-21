"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Package, UserRound } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { cn } from "@/lib/utils"

interface AccountMenuProps {
  /** Chrome text colour class, matching the rest of the header actions. */
  chromeText: string
  /** Chrome hover class, matching the rest of the header actions. */
  chromeHover: string
}

/**
 * Desktop account control: the avatar is a link to /account (so a touch tap
 * still navigates), and on hover/focus it reveals a dropdown with account
 * actions — mirroring the main NavDropdown glass panel. On mobile the dropdown
 * never opens (no hover); account navigation there lives in the mobile sheet.
 */
export function AccountMenu({ chromeText, chromeHover }: AccountMenuProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!user) return null

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current)
  }
  const openNow = () => {
    cancelClose()
    setOpen(true)
  }
  const closeSoon = () => {
    cancelClose()
    timer.current = setTimeout(() => setOpen(false), 120)
  }

  async function handleSignOut() {
    setSigningOut(true)
    setOpen(false)
    await signOut()
    router.replace("/")
  }

  const displayName = user.profile.displayName || user.name

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href="/account"
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          chromeText,
          chromeHover,
        )}
        aria-label="Your account"
        aria-expanded={open}
        aria-haspopup="menu"
        onFocus={openNow}
        onBlur={closeSoon}
      >
        <UserAvatar name={displayName} src={user.profile.avatarUrl} size={28} />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-3 w-64"
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
            role="menu"
          >
            {/* hover bridge so the gap below the trigger doesn't close the panel */}
            <div className="absolute inset-x-0 -top-3 h-3" aria-hidden />
            <div className="glass overflow-hidden rounded-2xl border p-2 shadow-2xl backdrop-blur-xl backdrop-saturate-150">
              <div className="flex items-center gap-3 border-b border-foreground/10 px-3 pb-3 pt-2">
                <UserAvatar name={displayName} src={user.profile.avatarUrl} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                  <span className="block truncate text-xs text-foreground/40">{user.email}</span>
                </span>
              </div>

              <div className="pt-2">
                <MenuLink
                  href="/account"
                  label="Profile"
                  onSelect={() => setOpen(false)}
                  icon={<UserRound className="h-4 w-4" strokeWidth={1.5} />}
                />
                <MenuLink
                  href="/account?tab=orders"
                  label="Orders & invoices"
                  onSelect={() => setOpen(false)}
                  icon={<Package className="h-4 w-4" strokeWidth={1.5} />}
                />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({
  href,
  label,
  icon,
  onSelect,
}: {
  href: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5"
    >
      {icon}
      {label}
    </Link>
  )
}
