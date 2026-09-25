"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Megaphone, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  addSubscriberAction,
  createCampaignAction,
  deleteCampaignAction,
  removeSubscriberAction,
  toggleSubscriberAction,
} from "@/features/email/admin-actions"

export type CampaignItem = {
  id: number
  name: string
  subject: string
  status: string
  stats: { recipients?: number; sent?: number; failed?: number; skipped?: number } | null
  updatedAt: string | Date
  sentAt: string | Date | null
}
export type SubscriberItem = {
  id: number
  email: string
  name: string
  optedIn: boolean
  source: string
}

const STATUS_STYLES: Record<string, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  sending: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function CampaignList({
  campaigns,
  subscribers,
}: {
  campaigns: CampaignItem[]
  subscribers: SubscriberItem[]
}) {
  const optedIn = subscribers.filter((s) => s.optedIn).length

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Campaigns</h2>
            <p className="text-sm text-muted-foreground">Broadcast a template to your audience and track the result.</p>
          </div>
          <NewCampaignButton />
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Megaphone className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">No campaigns yet. Create your first broadcast.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {campaigns.map((c) => (
              <li key={c.id}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent-teal/40">
                  <Link href={`/admin/email/campaigns/${c.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[c.status] ?? "")}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{c.subject || "No subject yet"}</p>
                    {c.status === "sent" && c.stats ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {c.stats.sent ?? 0} sent · {c.stats.failed ?? 0} failed · {fmt(c.sentAt ?? c.updatedAt)}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Updated {fmt(c.updatedAt)}</p>
                    )}
                  </Link>
                  <DeleteCampaignButton id={c.id} name={c.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SubscriberPanel subscribers={subscribers} optedIn={optedIn} />
    </div>
  )
}

function NewCampaignButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      className="gap-2"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await createCampaignAction({
            name: "Untitled campaign",
            subject: "",
            previewText: "",
            audience: { type: "all_subscribers" },
          })
          if (res.ok) router.push(`/admin/email/campaigns/${res.id}`)
          else toast.error("Could not create campaign")
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      New campaign
    </Button>
  )
}

function DeleteCampaignButton({ id, name }: { id: number; name: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &quot;{name}&quot;?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">This permanently removes the campaign and its history.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteCampaignAction(id)
                if (res.ok) {
                  toast.success("Campaign deleted")
                  setOpen(false)
                  router.refresh()
                } else toast.error("Could not delete campaign")
              })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SubscriberPanel({ subscribers, optedIn }: { subscribers: SubscriberItem[]; optedIn: number }) {
  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-accent-teal" aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Subscribers</h3>
          </div>
          <AddSubscriberDialog />
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          <span className="text-2xl font-semibold text-foreground">{optedIn}</span> opted in · {subscribers.length} total
        </p>
        {subscribers.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No subscribers yet. Newsletter signups land here automatically.
          </p>
        ) : (
          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {subscribers.map((s) => (
              <SubscriberRow key={s.id} subscriber={s} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function SubscriberRow({ subscriber }: { subscriber: SubscriberItem }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{subscriber.email}</p>
        {subscriber.name ? <p className="truncate text-xs text-muted-foreground">{subscriber.name}</p> : null}
      </div>
      <Switch
        checked={subscriber.optedIn}
        disabled={pending}
        aria-label="Opted in"
        onCheckedChange={(v) =>
          startTransition(async () => {
            await toggleSubscriberAction(subscriber.id, v)
            router.refresh()
          })
        }
      />
      <Button
        size="icon"
        variant="ghost"
        className="size-7 text-muted-foreground hover:text-destructive"
        aria-label="Remove subscriber"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await removeSubscriberAction(subscriber.id)
            router.refresh()
          })
        }
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}

function AddSubscriberDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5">
          <UserPlus className="size-3.5" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add subscriber</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sub-email">Email</Label>
            <Input id="sub-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Name</Label>
            <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !email.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await addSubscriberAction({ email, name })
                if (res.ok) {
                  toast.success("Subscriber added")
                  setEmail("")
                  setName("")
                  setOpen(false)
                  router.refresh()
                } else toast.error("Could not add subscriber")
              })
            }
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Add subscriber"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
