"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { LayoutDashboard, LogOut, Package, Tag, UserRound, X } from "lucide-react"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { cn } from "@/lib/utils"

interface AccountMenuProps {
  /** Chrome text colour class, matching the rest of the header actions. */
  chromeText: string
  /** Chrome hover class, matching the rest of the header actions. */
  chromeHover: string
}

interface AccountItem {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
}

/**
 * Account control with two presentations that share one item list:
 * - Desktop (md+): the avatar links to /account and reveals a hover dropdown
 *   mirroring the main NavDropdown glass panel.
 * - Mobile (<md): tapping the avatar opens a right-side slide-in drawer, the
 *   same sheet pattern as the cart and mobile nav, so it always fits the
 *   viewport instead of a fixed-offset dropdown that clips off-screen.
 */
export function AccountMenu({ chromeText, chromeHover }: AccountMenuProps) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [drawerOpen])

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

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
    setDrawerOpen(false)
    await signOut()
    // Hard navigation home so a guarded page's RouteGuard can't intercept the
    // now-unauthenticated session and bounce us to /sign-in mid-transition.
    window.location.replace("/")
  }

  const displayName = user.profile.displayName || user.name

  const items: AccountItem[] = [
    {
      href: "/account",
      label: "Profile",
      active: pathname === "/account",
      icon: <UserRound className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      href: "/account?tab=orders",
      label: "Orders & invoices",
      icon: <Package className="h-4 w-4" strokeWidth={1.5} />,
    },
    {
      href: "/account?tab=offers",
      label: "Offers",
      icon: <Tag className="h-4 w-4" strokeWidth={1.5} />,
    },
    ...(user.role === "admin"
      ? [
          {
            href: "/admin",
            label: "Admin dashboard",
            active: pathname.startsWith("/admin"),
            icon: <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />,
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Desktop: avatar link + hover dropdown (never mounts on mobile). */}
      <div className="relative hidden md:block" onMouseEnter={openNow} onMouseLeave={closeSoon}>
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
                  {items.map((item) => (
                    <MenuLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      active={item.active}
                      onSelect={() => setOpen(false)}
                      icon={item.icon}
                    />
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
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

      {/* Mobile: avatar button opens a right-side drawer. */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors md:hidden",
          chromeText,
          chromeHover,
        )}
        aria-label="Your account"
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
      >
        <UserAvatar name={displayName} src={user.profile.avatarUrl} size={28} />
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.aside
              className="glass backdrop-blur-xl backdrop-saturate-150 fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col border-l md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              role="dialog"
              aria-label="Account"
            >
              <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">Account</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label="Close account menu"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-4">
                  <UserAvatar name={displayName} src={user.profile.avatarUrl} size={44} />
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.15em] text-foreground/40">
                      Signed in
                    </span>
                    <span className="block truncate text-base font-semibold text-foreground">{displayName}</span>
                    <span className="block truncate text-sm text-foreground/40">{user.email}</span>
                  </span>
                </div>

                <div className="my-2 h-px bg-foreground/10" />

                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
                      item.active
                        ? "bg-accent-teal/10 text-accent-teal"
                        : "text-foreground/80 hover:bg-accent-teal/10 hover:text-accent-teal",
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-base font-medium text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function MenuLink({
  href,
  label,
  icon,
  active = false,
  onSelect,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active?: boolean
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent-teal/10 text-accent-teal"
          : "text-foreground/80 hover:bg-accent-teal/10 hover:text-accent-teal",
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
