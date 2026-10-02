"use client"

import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { charCountTone, findSpamFlags, type CopyFlag } from "@/features/email/copy-quality"

/**
 * Character counter + optional spam-trigger-word hint for the subject line
 * and preview text fields. Shared between the template and campaign editors
 * so both give a content manager the same inbox-truncation and deliverability
 * signal before they save or send.
 */
export function CopyQualityHint({
  value,
  limit,
  checkSpam,
}: {
  value: string
  limit: number
  /** Only the subject line benefits from a spam-word scan. */
  checkSpam?: boolean
}) {
  const length = value.length
  const tone = charCountTone(length, limit)
  const flags: CopyFlag[] = checkSpam ? findSpamFlags(value) : []

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {flags.map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-600 dark:text-amber-400"
            title={`"${f.match}" can trigger spam filters or read as spammy`}
          >
            <AlertTriangle className="size-3" aria-hidden />
            {f.label}
          </span>
        ))}
      </div>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          tone === "ok" && "text-muted-foreground",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "over" && "text-destructive",
        )}
      >
        {length}/{limit}
      </span>
    </div>
  )
}
