import type { ProductFeature } from "@/lib/types"
import { Reveal } from "@/components/primitives"

export function ProductFeatures({ features }: { features: ProductFeature[] }) {
  return (
    <section className="relative z-10 bg-background px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:grid-cols-2">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08} className="h-full">
              <article className="group h-full rounded-3xl border border-foreground/10 bg-foreground/[0.02] p-8 transition-colors hover:border-foreground/20 md:p-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tighter text-foreground md:text-6xl">
                    {feature.stat}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                    {feature.statUnit}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/50">{feature.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
