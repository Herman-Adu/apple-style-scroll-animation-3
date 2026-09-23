"use client"

import type React from "react"
import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Building2, Check, FileText, ImageIcon, MapPin, Phone, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyFieldset } from "./company-field"
import { useCompanyProfile } from "../hooks/use-company-profile"
import {
  addressSubFields,
  companySections,
  formatAddressOneLine,
  isAddressEmpty,
  validateAddress,
  validateCompanyField,
  type CompanyAddressSubKey,
  type CompanyProfile,
  type CompanyScalarKey,
} from "@/lib/data/company"
import { cn } from "@/lib/utils"

const MAX_LOGO_BYTES = 2 * 1024 * 1024 // 2MB

const TAB_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  identity: Building2,
  contact: Phone,
  address: MapPin,
  registration: FileText,
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function CompanyProfileView() {
  const { company, update } = useCompanyProfile()
  const [draft, setDraft] = useState<CompanyProfile>(company)
  const [tab, setTab] = useState(companySections[0].id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setScalar(key: CompanyScalarKey, value: string) {
    setSaved(false)
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function setAddress(key: CompanyAddressSubKey, value: string) {
    setSaved(false)
    setDraft((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
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

  // Full (gating) errors — required + format across every section.
  const fullScalarErrors = useMemo(() => {
    const errs: Partial<Record<CompanyScalarKey, string>> = {}
    for (const section of companySections) {
      for (const field of section.fields) {
        if (field.type === "address") continue
        const key = field.key as CompanyScalarKey
        const err = validateCompanyField(field, draft[key])
        if (err) errs[key] = err
      }
    }
    return errs
  }, [draft])

  const fullAddressErrors = useMemo(
    () => (isAddressEmpty(draft.address) ? {} : validateAddress(draft.address)),
    [draft.address],
  )

  // Live (format-only) errors — shown as the user types, without nagging about
  // required-but-empty fields before they try to save.
  const liveScalarErrors = useMemo(() => {
    const errs: Partial<Record<CompanyScalarKey, string>> = {}
    for (const section of companySections) {
      for (const field of section.fields) {
        if (field.type === "address" || !field.validate) continue
        const key = field.key as CompanyScalarKey
        const value = (draft[key] as string) ?? ""
        if (!value.trim()) continue
        const err = field.validate(value)
        if (err) errs[key] = err
      }
    }
    return errs
  }, [draft])

  const liveAddressErrors = useMemo(() => {
    const errs: Partial<Record<CompanyAddressSubKey, string>> = {}
    for (const sub of addressSubFields) {
      if (!sub.validate) continue
      const value = draft.address[sub.key] ?? ""
      if (!value.trim()) continue
      const err = sub.validate(value)
      if (err) errs[sub.key] = err
    }
    return errs
  }, [draft.address])

  const scalarErrorsShown = showErrors ? fullScalarErrors : liveScalarErrors
  const addressErrorsShown = showErrors ? fullAddressErrors : liveAddressErrors

  function sectionHasError(sectionId: string): boolean {
    if (!showErrors) return false
    const section = companySections.find((s) => s.id === sectionId)
    if (!section) return false
    return section.fields.some((field) =>
      field.type === "address"
        ? Object.keys(fullAddressErrors).length > 0
        : Boolean(fullScalarErrors[field.key as CompanyScalarKey]),
    )
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hasErrors = Object.keys(fullScalarErrors).length > 0 || Object.keys(fullAddressErrors).length > 0
    if (hasErrors) {
      setShowErrors(true)
      const firstBad = companySections.find((section) =>
        section.fields.some((field) =>
          field.type === "address"
            ? Object.keys(fullAddressErrors).length > 0
            : Boolean(fullScalarErrors[field.key as CompanyScalarKey]),
        ),
      )
      if (firstBad) setTab(firstBad.id)
      toast.error("Please fix the highlighted fields")
      return
    }
    setSaving(true)
    update(draft)
    setSaving(false)
    setSaved(true)
    setShowErrors(false)
    toast.success("Company profile saved")
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
          {companySections.map((section) => {
            const Icon = TAB_ICON[section.id]
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="relative gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground data-[state=active]:border-accent-teal/40 data-[state=active]:bg-accent-teal/10 data-[state=active]:text-accent-teal"
              >
                {Icon && <Icon className="size-4" strokeWidth={1.5} aria-hidden />}
                {section.label}
                {sectionHasError(section.id) && (
                  <span className="size-1.5 rounded-full bg-destructive" aria-label="Has errors" />
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {companySections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-0 focus-visible:outline-none">
            <motion.section
              {...fade}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <SectionHeader
                icon={TAB_ICON[section.id] ?? Building2}
                title={section.title}
                description={section.subtitle}
              />

              {section.id === "identity" && (
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onLogoChange}
                    className="sr-only"
                    aria-label="Upload company logo"
                  />
                </div>
              )}

              <div className="mt-6">
                <CompanyFieldset
                  fields={section.fields}
                  draft={draft}
                  scalarErrors={scalarErrorsShown}
                  addressErrors={addressErrorsShown}
                  onScalarChange={setScalar}
                  onAddressChange={setAddress}
                />

                {section.id === "address" && !isAddressEmpty(draft.address) && (
                  <div className="mt-5 rounded-xl border border-border bg-foreground/[0.02] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Preview</p>
                    <p className="mt-1.5 text-sm text-foreground">{formatAddressOneLine(draft.address)}</p>
                  </div>
                )}
              </div>
            </motion.section>
          </TabsContent>
        ))}
      </Tabs>

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
