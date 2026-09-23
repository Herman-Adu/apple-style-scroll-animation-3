"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CompanyFieldset } from "./company-field"
import { useCompanyProfile } from "../hooks/use-company-profile"
import {
  addressSubFields,
  companyOnboardingSteps,
  isAddressEmpty,
  validateAddress,
  validateCompanyField,
  type CompanyAddressSubKey,
  type CompanyProfile,
  type CompanyScalarKey,
} from "@/lib/data/company"

/**
 * First-run company onboarding, shown as a full-screen takeover inside the admin
 * dashboard when the store has no company profile yet. Mirrors the storefront
 * onboarding flow but collects *business* details and is skippable.
 */
export function AdminOnboarding() {
  const { company, completeOnboarding, skipOnboarding } = useCompanyProfile()
  const [mounted, setMounted] = useState(false)

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [draft, setDraft] = useState<CompanyProfile>(company)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Seed the draft from any existing values once, when the overlay first mounts.
  useEffect(() => {
    setDraft(company)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const step = companyOnboardingSteps[stepIndex]
  const isLast = stepIndex === companyOnboardingSteps.length - 1
  const progress = ((stepIndex + 1) / companyOnboardingSteps.length) * 100

  const hasAddressField = step.fields.some((field) => field.type === "address")

  // Gating errors (required + format) — used to disable Continue / Finish.
  const gateScalarErrors = useMemo(() => {
    const errs: Partial<Record<CompanyScalarKey, string>> = {}
    for (const field of step.fields) {
      if (field.type === "address") continue
      const key = field.key as CompanyScalarKey
      const err = validateCompanyField(field, draft[key])
      if (err) errs[key] = err
    }
    return errs
  }, [step, draft])

  const gateAddressErrors = useMemo(() => {
    if (!hasAddressField) return {}
    // An empty address is allowed (the whole flow is skippable); only validate once
    // the admin starts filling it in.
    return isAddressEmpty(draft.address) ? {} : validateAddress(draft.address)
  }, [hasAddressField, draft.address])

  const stepValid = Object.keys(gateScalarErrors).length === 0 && Object.keys(gateAddressErrors).length === 0

  // Live (format-only) errors — shown as the admin types, without nagging about
  // required-but-empty fields (the disabled button already signals that).
  const liveScalarErrors = useMemo(() => {
    const errs: Partial<Record<CompanyScalarKey, string>> = {}
    for (const field of step.fields) {
      if (field.type === "address" || !field.validate) continue
      const key = field.key as CompanyScalarKey
      const value = (draft[key] as string) ?? ""
      if (!value.trim()) continue
      const err = field.validate(value)
      if (err) errs[key] = err
    }
    return errs
  }, [step, draft])

  const liveAddressErrors = useMemo(() => {
    const errs: Partial<Record<CompanyAddressSubKey, string>> = {}
    if (!hasAddressField) return errs
    for (const sub of addressSubFields) {
      if (!sub.validate) continue
      const value = draft.address[sub.key] ?? ""
      if (!value.trim()) continue
      const err = sub.validate(value)
      if (err) errs[sub.key] = err
    }
    return errs
  }, [hasAddressField, draft.address])

  if (!mounted || company.onboarded) return null

  function setScalar(key: CompanyScalarKey, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function setAddress(key: CompanyAddressSubKey, value: string) {
    setDraft((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
  }

  function goNext() {
    if (!isLast) {
      setDirection(1)
      setStepIndex((i) => i + 1)
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      setDirection(-1)
      setStepIndex((i) => i - 1)
    }
  }

  function finish() {
    setSubmitting(true)
    completeOnboarding(draft)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-0 h-[480px] w-[480px] rounded-full bg-accent-teal/[0.06] blur-[120px]"
      />
      <div className="relative w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-[0.35em] text-foreground">MOMO</span>
            <span className="rounded-sm border border-accent-teal/30 bg-accent-teal/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-teal">
              Admin
            </span>
          </span>
          <button
            type="button"
            onClick={skipOnboarding}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now
          </button>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>
              Step {stepIndex + 1} / {companyOnboardingSteps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-px w-full bg-border">
            <motion.div
              className="h-px bg-accent-teal"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">{step.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.subtitle}</p>

            <div className="mt-10">
              <CompanyFieldset
                fields={step.fields}
                draft={draft}
                scalarErrors={liveScalarErrors}
                addressErrors={liveAddressErrors}
                onScalarChange={setScalar}
                onAddressChange={setAddress}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back
          </Button>

          {isLast ? (
            <Button
              type="button"
              onClick={finish}
              disabled={!stepValid || submitting}
              className="h-11 bg-accent-teal px-6 text-background hover:bg-accent-teal/90"
            >
              {submitting ? (
                <Spinner className="size-4" />
              ) : (
                <>
                  Finish setup
                  <Check className="ml-2 h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!stepValid}
              className="h-11 bg-accent-teal px-6 text-background hover:bg-accent-teal/90"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
