"use client"

import { forwardRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

/**
 * Dark-themed labeled input used across the auth + account forms. Password
 * fields (`type="password"`) automatically get a show/hide toggle so users
 * can verify what they typed before submitting.
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, id, className, type, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === "password"

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs uppercase tracking-[0.2em] text-foreground/50">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          ref={ref}
          type={isPassword && revealed ? "text" : type}
          className={cn(
            "h-11 border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-foreground/30 focus-visible:border-foreground/30 focus-visible:ring-foreground/10",
            isPassword && "pr-11",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            tabIndex={-1}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground/40 transition-colors hover:text-foreground/70"
          >
            {revealed ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        )}
      </div>
    </div>
  )
})
