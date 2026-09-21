"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { openingHours } from "@/lib/data/contact"
import { cn } from "@/lib/utils"

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function formatHour(time: string) {
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`
}

export function OpeningHours() {
  // Stays null on the server and first client render to avoid hydration mismatch;
  // the "open now" state resolves after mount using the visitor's local time.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // JS getDay(): 0=Sun..6=Sat. Shift so Monday is index 0 to match our data.
  const todayIndex = now ? (now.getDay() + 6) % 7 : -1
  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : -1
  const today = todayIndex >= 0 ? openingHours[todayIndex] : null
  const openNow =
    !!today &&
    !!today.open &&
    !!today.close &&
    nowMinutes >= toMinutes(today.open) &&
    nowMinutes < toMinutes(today.close)

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          <Clock className="h-4 w-4" strokeWidth={1.5} />
          Opening hours
        </div>
        {now && (
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]",
              openNow ? "bg-emerald-400/15 text-emerald-300" : "bg-foreground/10 text-foreground/50",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", openNow ? "bg-emerald-400" : "bg-foreground/40")}
              aria-hidden
            />
            {openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      <ul className="mt-5 flex flex-col gap-1">
        {openingHours.map((d, i) => {
          const isToday = i === todayIndex
          return (
            <li
              key={d.day}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                isToday ? "bg-foreground/5 text-foreground" : "text-foreground/60",
              )}
            >
              <span className="flex items-center gap-2">
                {d.day}
                {isToday && (
                  <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-foreground/60">
                    Today
                  </span>
                )}
              </span>
              <span className={cn("tabular-nums", !d.open && "text-foreground/30")}>
                {d.open && d.close ? `${formatHour(d.open)} – ${formatHour(d.close)}` : "Closed"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
