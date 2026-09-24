import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Mail,
  Megaphone,
  Send,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type OverviewStats = {
  total: number
  sent: number
  failed: number
  campaigns: number
  templates: number
  subscribers: number
  recent: {
    id: number
    to: string
    subject: string
    templateKey: string
    type: string
    status: string
    createdAt: string | Date
  }[]
}

const STATUS_STYLES: Record<string, string> = {
  sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  skipped: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

const QUICK_LINKS = [
  { href: "/admin/email/templates", label: "Edit templates", icon: FileText, desc: "Branded, block-based emails" },
  { href: "/admin/email/campaigns", label: "New campaign", icon: Megaphone, desc: "Broadcast to your audience" },
  { href: "/admin/email/messages", label: "Message a customer", icon: Mail, desc: "Reply with presets" },
]

export function EmailOverview({ stats, configured }: { stats: OverviewStats; configured: boolean }) {
  const metrics = [
    { label: "Emails sent", value: stats.sent, icon: Send },
    { label: "Templates", value: stats.templates, icon: FileText },
    { label: "Campaigns", value: stats.campaigns, icon: Megaphone },
    { label: "Subscribers", value: stats.subscribers, icon: Users },
  ]

  return (
    <div className="space-y-6">
      {/* Delivery status banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border p-4",
          configured
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5",
        )}
      >
        {configured ? (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {configured ? "Email delivery is live" : "Email delivery is in preview mode"}
          </p>
          <p className="text-sm text-muted-foreground">
            {configured
              ? "Resend is connected. Transactional emails, campaigns and messages send for real."
              : "RESEND_API_KEY isn't set, so sends are logged as no-ops. Everything else works — add the key to go live."}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</span>
              <m.icon className="size-4 text-accent-teal" aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* Recent activity */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Recent activity
          </h3>
          {stats.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No emails sent yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{log.subject}</span>
                      <Badge variant="outline" className={cn("shrink-0 capitalize", STATUS_STYLES[log.status] ?? "")}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.to} · <span className="capitalize">{log.type}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmt(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent-teal/40"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-teal/10 text-accent-teal">
                <link.icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium group-hover:text-accent-teal">{link.label}</p>
                <p className="truncate text-xs text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent-teal" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
