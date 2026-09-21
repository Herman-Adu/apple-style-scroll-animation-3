import type { Metadata } from "next"
import { ContactChannels } from "@/components/contact/contact-channels"
import { OpeningHours } from "@/components/contact/opening-hours"
import { ContactForm } from "@/components/contact/contact-form"
import { StoreMap } from "@/components/contact/store-map"
import { pageHeroes } from "@/lib/data/heroes"
import { PageHero } from "@/components/layout/page-hero"

export const metadata: Metadata = {
  title: "Contact — Momo Audio",
  description:
    "Get in touch with Momo Audio. General enquiries, product support, reviews, wholesale, and press — plus our opening hours and studios.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHero content={pageHeroes.contact} />

      <div className="mx-auto max-w-7xl px-5 pt-16 md:px-10 md:pt-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* Left — multi-step form */}
          <div id="enquiry" className="scroll-mt-28">
            <ContactForm />
          </div>

          {/* Right — info & store map */}
          <div className="flex flex-col gap-6">
            <ContactChannels />
            <div id="hours" className="scroll-mt-28">
              <OpeningHours />
            </div>
            <div id="studios" className="scroll-mt-28">
              <StoreMap />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
