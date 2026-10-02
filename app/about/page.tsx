import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { companyValues, siteConfig } from "@/lib/data/site";
import { pageHeroes } from "@/lib/data/heroes";
import { PageHero } from "@/components/layout/page-hero";
import { SectionHeading } from "@/components/primitives/section-heading";
import { AboutTimeline } from "@/features/timeline";
import { fetchMilestones } from "@/features/timeline/server";

export const metadata: Metadata = {
  title: "About",
  description: siteConfig.description,
};

export default async function AboutPage() {
  const milestones = await fetchMilestones();

  return (
    <main className="bg-background">
      <PageHero content={pageHeroes.about} />

      {/* Our story */}
      <section id="intro" className="scroll-mt-24 px-6 pt-28 md:px-12 md:pt-36">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/60">
            Our story
          </p>
          <SectionHeading
            className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl"
            title="A decade chasing one uncompromising standard."
            accent="uncompromising standard."
          />
          <p className="mt-8 max-w-2xl text-pretty text-xl leading-relaxed text-foreground/60">
            {siteConfig.name} started with three engineers and one anechoic
            chamber. A decade later, the mission has not changed: reproduce what
            the artist made, with nothing added and nothing taken away.
          </p>
        </div>
      </section>

      {/* Values */}
      <section
        id="values"
        className="scroll-mt-24 px-6 py-28 md:px-12 md:py-36"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-foreground/10 bg-foreground/10 md:grid-cols-3">
            {companyValues.map((value) => (
              <div key={value.title} className="bg-background p-10">
                <SectionHeading
                  className="text-xl font-semibold text-foreground"
                  title={value.title}
                  emphasis="secondary"
                />
                <p className="mt-4 text-base leading-relaxed text-foreground/60">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section
        id="timeline"
        className="scroll-mt-24 border-t border-foreground/10 px-6 py-28 md:px-12 md:py-36"
      >
        <div className="mx-auto mb-20 max-w-7xl">
          <SectionHeading
            className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl"
            title="A decade of listening."
          />
        </div>
        <AboutTimeline milestones={milestones} />
      </section>

      {/* CTA */}
      <section
        id="visit"
        className="scroll-mt-24 border-t border-foreground/10 px-6 py-28 md:px-12 md:py-40"
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <SectionHeading
            className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl"
            title="Hear the difference for yourself."
            accent="for yourself."
          />
          <p className="mt-6 max-w-lg text-lg text-foreground/60">
            Explore the collection engineered in our lab and tuned to a single,
            uncompromising standard.
          </p>
          <Link
            href="/products"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Explore products
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </main>
  );
}
