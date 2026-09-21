import type { ProductSpec } from "@/lib/types"

export function ProductSpecs({ specs }: { specs: ProductSpec[] }) {
  return (
    <section className="relative z-10 border-t border-foreground/10 bg-background px-6 py-24 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <p className="mb-12 font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/40">Technical Specifications</p>
        <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((spec) => (
            <div key={spec.label} className="border-t border-foreground/10 pt-4">
              <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">{spec.label}</dt>
              <dd className="mt-2 text-lg text-foreground">
                {spec.value}
                {spec.unit && <span className="ml-1 text-sm text-foreground/50">{spec.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
