"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle({
  chromeText = "text-foreground",
  chromeHover = "hover:bg-foreground/10",
}: {
  chromeText?: string
  chromeHover?: string
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Theme is only known on the client, so defer rendering the icon until mounted
  // to avoid a hydration mismatch.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        chromeText,
        chromeHover,
      )}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} theme` : "Toggle theme"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <Moon className="h-5 w-5" strokeWidth={1.5} />
        )
      ) : (
        // Placeholder keeps layout stable before hydration.
        <span className="h-5 w-5" />
      )}
    </button>
  )
}
