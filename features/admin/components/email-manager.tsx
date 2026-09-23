"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Mail, Send, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getEmailConfigured, sendTestEmail } from "@/features/email"

const TEMPLATES = [
  {
    name: "Order confirmation",
    trigger: "Sent automatically when a customer completes checkout.",
    status: "Live",
  },
  {
    name: "Low-stock alert",
    trigger: "Sent to the store owner when a product drops to its low-stock threshold.",
    status: "Live",
  },
]

export function EmailManager() {
  const searchParams = useSearchParams()
  const [configured, setConfigured] = useState(false)
  const [testTo, setTestTo] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getEmailConfigured().then(setConfigured)
  }, [])

  // Prefill the recipient when arriving from a customer's "Email" action.
  useEffect(() => {
    const to = searchParams.get("to")
    if (to) setTestTo(to)
  }, [searchParams])

  async function onSendTest() {
    if (!testTo.trim()) {
      toast.error("Enter a recipient email.")
      return
    }
    setSending(true)
    const result = await sendTestEmail({ to: testTo.trim() })
    setSending(false)
    if (result.ok) {
      toast.success(`Test email sent to ${testTo.trim()}`)
    } else {
      toast.error(result.error ?? "Failed to send test email.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Connection status */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-full",
                configured ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500",
              )}
            >
              {configured ? <CheckCircle2 className="size-5" aria-hidden /> : <XCircle className="size-5" aria-hidden />}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {configured ? "Resend connected" : "Resend not configured"}
              </p>
              <p className="text-sm text-muted-foreground">
                {configured
                  ? "Sending from your verified domain."
                  : "Add RESEND_API_KEY in project settings to enable sending. Templates are ready and will activate automatically."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Transactional templates</h2>
        </div>
        <div className="divide-y divide-border">
          {TEMPLATES.map((t) => (
            <div key={t.name} className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.trigger}</p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                  configured
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-border bg-foreground/5 text-muted-foreground",
                )}
              >
                {configured ? t.status : "Pending key"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Test send */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Send a test email</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify delivery end-to-end. With a verified domain you can send anywhere; otherwise Resend only delivers to
          your own account address.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="test-to">Recipient</Label>
            <Input
              id="test-to"
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="you@example.com"
              disabled={!configured}
            />
          </div>
          <Button onClick={onSendTest} disabled={!configured || sending} className="gap-2">
            <Send className="size-4" aria-hidden />
            {sending ? "Sending…" : "Send test"}
          </Button>
        </div>
        {!configured ? (
          <p className="mt-2 text-xs text-muted-foreground">Test sending is disabled until a Resend API key is added.</p>
        ) : null}
      </section>
    </div>
  )
}
