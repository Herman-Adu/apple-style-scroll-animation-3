"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Generic collapsible section for a labelled group of items with a count badge.
 * Used to organise admin lists (docs, email templates, etc.) into scalable
 * categories instead of one flat grid — reuse this wherever a new grouping
 * surface is needed as the catalog of items grows.
 */
export function CategoryDisclosure({
  label,
  icon: Icon,
  count,
  itemLabel = "item",
  open,
  onToggle,
  children,
}: {
  label: string
  icon: LucideIcon
  count: number
  itemLabel?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-card/30 px-4 py-1 transition-colors hover:border-foreground/20">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full items-center gap-3 py-4 text-left"
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
              open
                ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                : "border-foreground/10 bg-foreground/[0.03] text-foreground/50 group-hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-foreground">{label}</span>
          </span>
          <span className="font-mono text-[10px] text-foreground/30">
            {count} {count === 1 ? itemLabel : `${itemLabel}s`}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-200",
              open && "rotate-180 text-accent-teal",
            )}
            strokeWidth={2}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
