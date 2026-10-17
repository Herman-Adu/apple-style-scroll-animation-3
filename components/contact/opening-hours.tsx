"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { openingHours } from "@/features/contact";
import { cn } from "@/lib/utils";

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0
    ? `${hour} ${suffix}`
    : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function OpeningHours() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // JS getDay(): 0=Sun..6=Sat. Shift so Monday is index 0 to match our data.
  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = openingHours[todayIndex] ?? null;
  const openNow =
    !!today &&
    !!today.open &&
    !!today.close &&
    nowMinutes >= toMinutes(today.open) &&
    nowMinutes < toMinutes(today.close);

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          <Clock className="h-4 w-4" strokeWidth={1.5} />
          Opening hours
        </div>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em]",
            openNow
              ? "bg-success/10 text-success"
              // `text-muted-foreground` read 4.27:1 on dark and 4.23:1 on light
              // against this tint - the pill's own `foreground/10` lifts the
              // surface just enough to drop it under AA. The closed state only
              // renders outside opening hours, so every scan that ever ran
              // during the working day saw the green branch instead and the
              // S66 muted-label sweep could not reach it. Measured at 8.97:1
              // and 5.83:1 at /75.
              : "bg-foreground/10 text-foreground/75",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              openNow ? "bg-success" : "bg-foreground/40",
            )}
            aria-hidden
          />
          {openNow ? "Open now" : "Closed"}
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-1">
        {openingHours.map((d, i) => {
          const isToday = i === todayIndex;
          return (
            <li
              key={d.day}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                // Accent text on an accent tint: the tint darkens with the
                // token, so the accent keeps only part of what it gains and
                // reads 4.37:1 here. --accent-teal-muted is a tone deeper and
                // still follows a client's palette through the theme layer.
                isToday
                  ? "bg-accent-teal/10 text-accent-teal-muted"
                  : "text-foreground/60",
              )}
            >
              <span className="flex items-center gap-2">
                {d.day}
                {isToday && (
                  // Solid, not a second tint: this pill sits inside the already
                  // tinted today row, and stacked tints leave no tone that works
                  // in both themes - the tint darkens the surface on light and
                  // lightens it on dark, so the text would have to move in
                  // opposite directions. A filled accent is 5.24:1 and 9.44:1.
                  <span className="rounded-full bg-accent-teal px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-background">
                    Today
                  </span>
                )}
              </span>
              <span
                className={cn("tabular-nums", !d.open && "text-muted-foreground")}
              >
                {d.open && d.close
                  ? `${formatHour(d.open)} – ${formatHour(d.close)}`
                  : "Closed"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
