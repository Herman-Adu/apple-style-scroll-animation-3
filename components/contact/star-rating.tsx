"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: number
}

export function StarRating({ value, onChange, size = 30 }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div role="radiogroup" aria-label="Rating out of 5" className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-md p-0.5 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-foreground/40"
        >
          <Star
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            className={cn("transition-colors", n <= active ? "fill-white text-foreground" : "text-foreground/25")}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-foreground/50">{value ? `${value}/5` : "Tap to rate"}</span>
    </div>
  )
}
