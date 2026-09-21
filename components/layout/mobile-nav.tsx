"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Mail, User, X } from "lucide-react"
import type { NavLink } from "@/lib/types"
import { mainNav, siteConfig } from "@/lib/data/site"
import { isSectionActive, isTopLevelActive } from "@/lib/nav"
import { useAuth } from "@/lib/auth/auth-context"
import { UserAvatar } from "@/components/account/user-avatar"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  open: boolean
  onClose: () => void
  activeId: string | null
  category: string | null
}

export function MobileNav({ open, onClose, activeId, category }: MobileNavProps) {
  const pathname = usePathname()
  const { status, user } = useAuth()
  const [submenu, setSubmenu] = useState<NavLink | null>(null)

  // Reset to the root panel whenever the sheet closes, and lock body scroll.
  useEffect(() => {
    if (!open) {
      setSubmenu(null)
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            className="glass backdrop-blur-xl backdrop-saturate-150 fixed inset-y-0 left-0 z-[70] flex w-[86%] max-w-sm flex-col border-r md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-5">
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-foreground">
                {siteConfig.shortName}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence initial={false} mode="popLayout">
                {submenu ? (
                  <motion.div
                    key="submenu"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 32, stiffness: 300 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => setSubmenu(null)}
                      className="flex items-center gap-2 border-b border-foreground/10 px-6 py-4 text-xs uppercase tracking-[0.2em] text-foreground/50 transition-colors hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                      Menu
                    </button>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                      <Link
                        href={submenu.href}
                        onClick={onClose}
                        className="flex items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-foreground/5"
                      >
                        <span className="text-lg font-semibold text-foreground">{submenu.label}</span>
                        <span className="flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-foreground/40">
                          View <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </span>
                      </Link>

                      <div className="my-2 h-px bg-foreground/10" />

                      {submenu.sections?.map((section) => {
                        const active = isSectionActive(section.href, pathname, category, activeId)
                        return (
                          <Link
                            key={section.href}
                            href={section.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-start gap-3 rounded-xl px-4 py-3.5 transition-colors",
                              active ? "bg-foreground/10" : "hover:bg-foreground/5",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                                active ? "bg-accent-teal" : "bg-foreground/25",
                              )}
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <span
                                className={cn(
                                  "block text-base font-medium transition-colors",
                                  active ? "text-foreground" : "text-foreground/80",
                                )}
                              >
                                {section.label}
                              </span>
                              {section.hint && (
                                <span className="block text-sm text-foreground/40">{section.hint}</span>
                              )}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="root"
                    initial={{ x: "-30%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "-30%", opacity: 0 }}
                    transition={{ type: "spring", damping: 32, stiffness: 300 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <nav className="flex-1 overflow-y-auto px-4 py-4">
                      {mainNav.map((link) => {
                        const active = isTopLevelActive(link.href, pathname)
                        if (link.sections?.length) {
                          return (
                            <button
                              key={link.href}
                              type="button"
                              onClick={() => setSubmenu(link)}
                              className="flex w-full items-center justify-between rounded-xl px-4 py-4 text-left transition-colors hover:bg-foreground/5"
                            >
                              <span
                                className={cn(
                                  "text-lg font-medium transition-colors",
                                  active ? "text-foreground" : "text-foreground/70",
                                )}
                              >
                                {link.label}
                              </span>
                              <ChevronRight className="h-5 w-5 text-foreground/40" strokeWidth={1.5} />
                            </button>
                          )
                        }
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className="flex items-center rounded-xl px-4 py-4 transition-colors hover:bg-foreground/5"
                          >
                            <span
                              className={cn(
                                "text-lg font-medium transition-colors",
                                active ? "text-foreground" : "text-foreground/70",
                              )}
                            >
                              {link.label}
                            </span>
                          </Link>
                        )
                      })}
                    </nav>

                    {/* Under the links — account, contact, and studios */}
                    <div className="space-y-4 border-t border-foreground/10 p-5">
                      {status === "authenticated" && user ? (
                        <Link
                          href="/account"
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 transition-colors hover:bg-foreground/[0.05]"
                        >
                          <UserAvatar
                            name={user.profile.displayName || user.name}
                            src={user.profile.avatarUrl}
                            size={40}
                          />
                          <span className="min-w-0">
                            <span className="block text-[11px] uppercase tracking-[0.15em] text-foreground/40">
                              Signed in
                            </span>
                            <span className="block truncate text-sm font-medium text-foreground">
                              {user.profile.displayName || user.name}
                            </span>
                          </span>
                          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-foreground/40" strokeWidth={1.5} />
                        </Link>
                      ) : (
                        <Link
                          href="/sign-in"
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 transition-colors hover:bg-foreground/[0.05]"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-foreground/60">
                            <User className="h-4 w-4" strokeWidth={1.5} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground">Sign in</span>
                            <span className="block text-xs text-foreground/40">Access your account</span>
                          </span>
                          <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-foreground/40" strokeWidth={1.5} />
                        </Link>
                      )}

                      <div className="space-y-2 px-1">
                        <a
                          href={`mailto:${siteConfig.email}`}
                          className="flex items-center gap-2.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
                        >
                          <Mail className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                          {siteConfig.email}
                        </a>
                        <p className="flex items-center gap-2.5 text-sm text-foreground/40">
                          <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                          {siteConfig.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
