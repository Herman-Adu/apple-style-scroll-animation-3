"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Building2, Check, ImageIcon, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { OnboardingFieldControl } from "@/components/auth/onboarding-field"
import { useCompanyProfile } from "../hooks/use-company-profile"
import { companyFields, companyOptionLabel, type CompanyProfile } from "@/lib/data/company"
import type { OnboardingField } from "@/lib/data/onboarding"
import { cn } from "@/lib/utils"

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function CompanyProfileView() {
  const { company, update } = useCompanyProfile()
  const [draft, setDraft] = useState<CompanyProfile>(company)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setValue(key: keyof CompanyProfile, value: unknown) {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  // The logo persists immediately so it shows up across the dashboard right away.
  function persistLogo(logoUrl: string | undefined) {
    setLogoError(null)
    setDraft((prev) => ({ ...prev, logoUrl }))
    update({ logoUrl })
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (!file) return
    setLogoError(null)
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file.")
      return
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Image must be under 2MB.")
      return
    }
    persistLogo(await fileToDataUrl(file))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    update(draft)
    setSaving(false)
    setSaved(true)
    toast.success("Company profile saved")
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Logo + identity */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <SectionHeader
          icon={Building2}
          title="Company identity"
          description="Your business details, used across invoices, receipts, and account correspondence."
        />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-foreground/[0.03]">
            {draft.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.logoUrl || "/placeholder.svg"} alt="Company logo" className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-7 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 border-border bg-transparent text-foreground hover:bg-foreground/5"
              >
                <Upload className="mr-2 h-4 w-4" aria-hidden />
                {draft.logoUrl ? "Change logo" : "Upload logo"}
              </Button>
              {draft.logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => persistLogo(undefined)}
                  className="h-9 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {logoError ?? "Square PNG or SVG works best, up to 2MB."}
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onLogoChange}
          className="sr-only"
          aria-label="Upload company logo"
        />
      </motion.section>

      {/* Details form */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <form className="flex flex-col gap-6" onSubmit={onSubmit}>
          {companyFields.map((field) => (
            <div key={field.key} className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{field.label}</label>
              <OnboardingFieldControl
                field={field as unknown as OnboardingField}
                value={draft[field.key]}
                onChange={(value) => setValue(field.key, value)}
              />
            </div>
          ))}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 bg-accent-teal px-6 text-background hover:bg-accent-teal/90"
            >
              {saving ? <Spinner className="size-4" /> : "Save changes"}
            </Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="h-4 w-4" aria-hidden />
                Saved
              </span>
            )}
          </div>
        </form>
      </motion.section>

      {/* Summary — human-readable snapshot */}
      <motion.section
        {...fade}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-3 sm:grid-cols-2"
      >
        <SummaryCard label="Company" value={company.companyName || "—"} />
        <SummaryCard label="Industry" value={companyOptionLabel("industry", company.industry) || "—"} />
        <SummaryCard label="Contact" value={company.contactPerson || "—"} />
        <SummaryCard label="Support phone" value={company.supportPhone || "—"} />
      </motion.section>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-sm text-foreground")}>{value}</p>
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
