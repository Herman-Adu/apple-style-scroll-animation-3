"use client"

import { forwardRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

/** Dark-themed labeled input used across the auth + account forms. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, id, className, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-foreground/50">
        {label}
      </Label>
      <Input
        id={id}
        ref={ref}
        className={cn(
          "h-11 border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 focus-visible:border-foreground/30 focus-visible:ring-foreground/10",
          className,
        )}
        {...props}
      />
    </div>
  )
})
