import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: "default" | "warning" | "danger"
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight",
          tone === "warning" && "text-amber-500",
          tone === "danger" && "text-red-500",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
