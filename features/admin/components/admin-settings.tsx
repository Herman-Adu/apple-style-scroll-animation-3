"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Monitor, Moon, Palette, Store, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface StoreSettings {
  storeName: string
  supportEmail: string
  currency: "GBP" | "USD" | "EUR"
  lowStockThreshold: number
  emailAlerts: boolean
}

const DEFAULTS: StoreSettings = {
  storeName: "MOMO Audio",
  supportEmail: "hello@momoaudio.com",
  currency: "GBP",
  lowStockThreshold: 5,
  emailAlerts: true,
}

const STORAGE_KEY = "admin:settings"

const currencies: { value: StoreSettings["currency"]; label: string; symbol: string }[] = [
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
]

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function AdminSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<StoreSettings>) })
    } catch {
      // ignore malformed storage
    }
  }, [])

  function persist(next: StoreSettings, message: string) {
    setSettings(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    toast.success(message)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Appearance */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <SectionHeader
          icon={Palette}
          title="Appearance"
          description="Choose how the admin dashboard looks on this device."
        />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const active = mounted && theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-colors",
                  active
                    ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                {option.label}
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* Store details */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <SectionHeader
          icon={Store}
          title="Store details"
          description="Public-facing store identity used across the storefront and invoices."
        />
        <form
          className="mt-5 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            persist(settings, "Store details saved")
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              value={settings.storeName}
              onChange={(e) => setSettings((s) => ({ ...s, storeName: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Currency</Label>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => {
                const active = settings.currency === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, currency: c.value }))}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal"
                        : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                    )}
                  >
                    <span className="text-base">{c.symbol}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="bg-accent-teal text-background hover:bg-accent-teal/90">
              Save changes
            </Button>
          </div>
        </form>
      </motion.section>

      {/* Notifications */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <SectionHeader
          icon={Bell}
          title="Notifications"
          description="Control restock alerts surfaced across the dashboard."
        />
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Email me restock alerts</p>
              <p className="text-xs text-muted-foreground">Send a summary when products drop below the threshold.</p>
            </div>
            <Switch
              checked={settings.emailAlerts}
              onCheckedChange={(checked) => persist({ ...settings, emailAlerts: checked }, "Notification preference saved")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lowStock">Low-stock threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                id="lowStock"
                type="number"
                min={0}
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, lowStockThreshold: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">units or fewer flags a product</span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => persist(settings, "Notification settings saved")}
              className="bg-accent-teal text-background hover:bg-accent-teal/90"
            >
              Save changes
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-teal/12 text-accent-teal ring-1 ring-accent-teal/25">
        <Icon className="size-4" strokeWidth={1.5} />
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
    </div>
  )
}
