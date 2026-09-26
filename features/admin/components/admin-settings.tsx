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
import { useStoreSettings } from "@/features/admin/hooks/use-settings"
import type { Currency } from "@/lib/settings/types"

const currencies: { value: Currency; label: string; symbol: string }[] = [
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
  // Store settings persist to Neon (singleton row) via the settings provider —
  // no localStorage. Writes are optimistic and reconciled with the DB row.
  const { settings, update } = useStoreSettings()
  const [mounted, setMounted] = useState(false)

  // Local draft for the store-details form, committed on submit. Seeded from
  // the authoritative settings, which are SSR-seeded so correct on first render.
  const [storeName, setStoreName] = useState(settings.storeName)
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail)
  const [currency, setCurrency] = useState<Currency>(settings.currency)
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold)

  useEffect(() => setMounted(true), [])

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
            update({ storeName, supportEmail, currency })
            toast.success("Store details saved")
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Currency</Label>
            <div className="grid grid-cols-3 gap-2">
              {currencies.map((c) => {
                const active = currency === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCurrency(c.value)}
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
              onCheckedChange={(checked) => {
                update({ emailAlerts: checked })
                toast.success("Notification preference saved")
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lowStock">Low-stock threshold</Label>
            <div className="flex items-center gap-3">
              <Input
                id="lowStock"
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(0, Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">units or fewer flags a product</span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                update({ lowStockThreshold })
                toast.success("Notification settings saved")
              }}
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
