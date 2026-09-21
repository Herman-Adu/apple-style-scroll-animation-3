"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import type { NavLink } from "@/lib/types"
import { isSectionActive, isTopLevelActive } from "@/lib/nav"
import { cn } from "@/lib/utils"

interface NavDropdownProps {
  link: NavLink
  activeId: string | null
  category: string | null
  onDark?: boolean
}

export function NavDropdown({ link, activeId, category, onDark = false }: NavDropdownProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPage = isTopLevelActive(link.href, pathname)
  const topClass = cn(
    "text-xs uppercase tracking-[0.2em] transition-colors",
    onDark
      ? onPage
        ? "text-white"
        : "text-white/60 hover:text-white"
      : onPage
        ? "text-foreground"
        : "text-foreground/50 hover:text-foreground",
  )

  if (!link.sections?.length) {
    return (
      <Link href={link.href} className={topClass}>
        {link.label}
      </Link>
    )
  }

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

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={link.href}
        className={cn(topClass, "inline-flex items-center gap-1.5")}
        aria-expanded={open}
        onFocus={openNow}
        onBlur={closeSoon}
      >
        {link.label}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
          strokeWidth={2}
        />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2"
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            {/* hover bridge so the gap below the trigger doesn't close the panel */}
            <div className="absolute inset-x-0 -top-4 h-4" aria-hidden />
            <div             className="glass backdrop-blur-xl backdrop-saturate-150 overflow-hidden rounded-2xl border p-2 shadow-2xl">
              {link.sections.map((section) => {
                const active = isSectionActive(section.href, pathname, category, activeId)
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
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
                          "block text-sm font-medium transition-colors",
                          active ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {section.label}
                      </span>
                      {section.hint && (
                        <span className="block text-xs text-foreground/40">{section.hint}</span>
                      )}
                    </span>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
