"use client"

import { useState } from "react"
import { MapPin, ExternalLink } from "lucide-react"
import { contactLocations } from "@/lib/data/contact"

function embedUrl(lat: number, lng: number) {
  const d = 0.01
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",")
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
}

function directionsUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

export function StoreMap() {
  const [active, setActive] = useState(0)
  const location = contactLocations[active]

  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02]">
      <div className="flex items-center gap-1 border-b border-foreground/10 p-2">
        {contactLocations.map((loc, i) => (
          <button
            key={loc.city}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              i === active ? "bg-foreground/10 text-foreground" : "text-foreground/50 hover:text-foreground/80"
            }`}
          >
            {loc.city}
          </button>
        ))}
      </div>

      <div className="relative aspect-[16/10] w-full bg-foreground/5">
        <iframe
          key={location.city}
          title={`Map of ${location.city} — ${location.role}`}
          src={embedUrl(location.lat, location.lng)}
          className="h-full w-full grayscale-[0.35] contrast-[1.1]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground/70">
            <MapPin className="h-4.5 w-4.5" strokeWidth={1.5} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{location.city}</span>
            <span className="text-xs text-foreground/45">{location.role}</span>
            <span className="mt-1 text-xs leading-relaxed text-foreground/55">{location.address}</span>
          </div>
        </div>
        <a
          href={directionsUrl(location.lat, location.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-foreground/10 px-3 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          Directions
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
        </a>
      </div>
    </div>
  )
}
