"use client"

import type React from "react"
import { OnboardingFieldControl } from "@/components/auth/onboarding-field"
import { Input } from "@/components/ui/input"
import {
  addressSubFields,
  type CompanyAddress,
  type CompanyAddressSubKey,
  type CompanyField,
  type CompanyProfile,
  type CompanyScalarKey,
} from "@/lib/data/company"
import type { OnboardingField } from "@/lib/data/onboarding"
import { cn } from "@/lib/utils"

const inputClass =
  "h-12 border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 focus-visible:border-foreground/30 focus-visible:ring-foreground/10"

const errorClass = "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/10"

function FieldShell({
  label,
  optional,
  error,
  hint,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {optional && <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      ) : null}
    </div>
  )
}

function ScalarField({
  field,
  value,
  error,
  onChange,
}: {
  field: CompanyField
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  if (field.type === "single-select") {
    return (
      <FieldShell label={field.label} error={error} hint={field.hint}>
        <OnboardingFieldControl
          field={field as unknown as OnboardingField}
          value={value}
          onChange={(next) => onChange(next as string)}
        />
      </FieldShell>
    )
  }

  return (
    <FieldShell label={field.label} optional={!field.required} error={error} hint={field.hint}>
      <Input
        type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
        inputMode={field.type === "tel" ? "tel" : field.type === "email" ? "email" : undefined}
        value={value ?? ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.label}
        aria-invalid={Boolean(error)}
        className={cn(inputClass, error && errorClass)}
      />
    </FieldShell>
  )
}

export function AddressFieldset({
  value,
  errors,
  onChange,
}: {
  value: CompanyAddress
  errors: Partial<Record<CompanyAddressSubKey, string>>
  onChange: (key: CompanyAddressSubKey, value: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {addressSubFields.map((sub) => {
        const error = errors[sub.key]
        return (
          <div key={sub.key} className={cn("space-y-2", sub.wide && "sm:col-span-2")}>
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {sub.label}
              {!sub.required && (
                <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span>
              )}
            </label>
            <Input
              value={value[sub.key] ?? ""}
              placeholder={sub.placeholder}
              autoComplete={sub.autoComplete}
              onChange={(e) => onChange(sub.key, e.target.value)}
              aria-label={sub.label}
              aria-invalid={Boolean(error)}
              className={cn(inputClass, error && errorClass)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders a section's fields against the company draft, dispatching scalar edits and
 * structured-address edits to the caller. Used by both the onboarding takeover and the
 * tabbed profile form so the two never diverge.
 */
export function CompanyFieldset({
  fields,
  draft,
  scalarErrors,
  addressErrors,
  onScalarChange,
  onAddressChange,
}: {
  fields: CompanyField[]
  draft: CompanyProfile
  scalarErrors: Partial<Record<CompanyScalarKey, string>>
  addressErrors: Partial<Record<CompanyAddressSubKey, string>>
  onScalarChange: (key: CompanyScalarKey, value: string) => void
  onAddressChange: (key: CompanyAddressSubKey, value: string) => void
}) {
  return (
    <div className="space-y-8">
      {fields.map((field) => {
        if (field.type === "address") {
          return (
            <AddressFieldset key="address" value={draft.address} errors={addressErrors} onChange={onAddressChange} />
          )
        }
        const key = field.key as CompanyScalarKey
        return (
          <ScalarField
            key={key}
            field={field}
            value={(draft[key] as string) ?? ""}
            error={scalarErrors[key]}
            onChange={(value) => onScalarChange(key, value)}
          />
        )
      })}
    </div>
  )
}
