import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { contactChannels } from "@/lib/data/contact"

const iconMap = {
  mail: Mail,
  phone: Phone,
  pin: MapPin,
} as const

export function ContactChannels() {
  return (
    <ul className="flex flex-col gap-3">
      {contactChannels.map((channel) => {
        const Icon = iconMap[channel.icon]
        const external = channel.href.startsWith("http")
        return (
          <li key={channel.id}>
            <Link
              href={channel.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="glass backdrop-blur-xl backdrop-saturate-150 flex items-start gap-4 rounded-2xl border p-5 transition-colors hover:border-accent-teal/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-teal/10 text-accent-teal">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.15em] text-foreground/40">{channel.label}</span>
                <span className="mt-0.5 text-sm font-medium text-foreground">{channel.value}</span>
                <span className="mt-1 text-xs text-foreground/45">{channel.note}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
