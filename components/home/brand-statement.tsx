import { Reveal } from "@/components/primitives"

export function BrandStatement() {
  return (
    <section className="relative z-10 bg-background px-6 py-32 md:px-12 md:py-44">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal y={0}>
          <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.5em] text-foreground/40">Our philosophy</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl md:leading-[1.1]">
            We do not tune for the demo. We tune for the truth of the recording — so the only thing between you and the
            artist is air.
          </h2>
        </Reveal>
      </div>
    </section>
  )
}
