"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"
import type { ExplodedHero, ExplodedLayer, Product, StoryBeat } from "@/lib/types"
import { AddToCartButton } from "@/features/products"

const alignmentClass: Record<StoryBeat["align"], string> = {
  left: "items-start text-left",
  right: "items-end text-right",
  center: "items-center text-center",
}

/**
 * A single component layer. It travels from its assembled position (parts
 * stacked together) to its exploded position (parts spread apart) as the
 * teardown progresses, then eases back as the scroll continues.
 */
function Layer({
  layer,
  explode,
  index,
  total,
}: {
  layer: ExplodedLayer
  explode: MotionValue<number>
  index: number
  total: number
}) {
  // Stagger each layer so they separate in sequence rather than all at once.
  const start = (index / total) * 0.35
  // Offsets are expressed in viewport height units so the parts travel a
  // meaningful distance (plain numbers would be interpreted as pixels).
  const y = useTransform(explode, [start, 1], [`${layer.assembledY}vh`, `${layer.explodedY}vh`])
  // Labels reveal only once the parts have meaningfully separated.
  const labelOpacity = useTransform(explode, [0.55, 0.72], [0, 1])

  return (
    <motion.div
      className="absolute left-1/2"
      style={{
        top: "50%",
        x: "-50%",
        y,
        width: "min(86vw, 46vh)",
        height: "min(86vw, 46vh)",
        marginTop: "calc(min(86vw, 46vh) / -2)",
        zIndex: layer.z,
      }}
    >
      <div className="relative h-full w-full">
        <Image
          src={layer.image || "/placeholder.svg"}
          alt={layer.label}
          fill
          priority={index < 3}
          sizes="(max-width: 768px) 78vw, 46vh"
          className="object-contain"
          style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.55))" }}
        />
        {/* Callout label + leader line, revealed on explode */}
        <motion.div
          className="absolute right-0 top-1/2 hidden translate-x-[calc(100%+1.5rem)] -translate-y-1/2 items-center gap-3 md:flex"
          style={{ opacity: labelOpacity }}
        >
          <span className="h-px w-10 bg-white/25" />
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.35em] text-white/70">
            {layer.label}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}

function BeatOverlay({
  beat,
  progress,
  isLast,
  product,
}: {
  beat: StoryBeat
  progress: MotionValue<number>
  isLast: boolean
  product: Product
}) {
  const opacity = useTransform(progress, beat.window, [0, 1, 1, isLast ? 1 : 0])
  const y = useTransform(progress, beat.window, [40, 0, 0, isLast ? 0 : -40])

  return (
    <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity, y }}>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
      <div className="relative px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
        <div className={`mx-auto flex max-w-7xl flex-col ${alignmentClass[beat.align]}`}>
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-white/60">
            {beat.index}
          </p>
          <h2 className="whitespace-pre-line text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            {beat.title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60 md:text-base">{beat.description}</p>
          {isLast && (
            <div className="mt-8">
              <AddToCartButton product={product} color={product.colors[0]} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function ExplodedStoryHero({ hero, product }: { hero: ExplodedHero; product: Product }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Parts spread apart through the first ~65% of the scroll, then hold.
  const explode = useTransform(progress, [0.1, 0.65], [0, 1])
  // Whole assembly drifts subtly for depth and zooms out as it explodes so the
  // fully separated teardown stays within the frame. No rotation — the slices
  // are horizontal and must stay axis-aligned to read as one cylinder.
  const assemblyY = useTransform(progress, [0, 1], ["4%", "-6%"])
  const assemblyScale = useTransform(explode, [0, 1], [0.82, 0.6])

  const glowScale = useTransform(explode, [0, 1], [1, 1.35])
  const glowOpacity = useTransform(explode, [0, 1], [0.3, 0.5])

  const introOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  return (
    <div ref={containerRef} className="relative" style={{ height: `${hero.scrollVh}vh` }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-black">
        {/* Accent glow behind the assembly */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[75vh] w-[75vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{ backgroundColor: hero.accent, scale: glowScale, opacity: glowOpacity }}
          aria-hidden
        />

        {/* Exploded assembly */}
        <motion.div
          className="absolute inset-0"
          style={{ y: assemblyY, scale: assemblyScale }}
        >
          {hero.layers.map((layer, index) => (
            <Layer
              key={layer.label}
              layer={layer}
              explode={explode}
              index={index}
              total={hero.layers.length}
            />
          ))}
        </motion.div>

        <div className="pointer-events-none absolute inset-0">
          {/* Intro */}
          <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: introOpacity }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent" />
            <div className="relative px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
              <div className="mx-auto max-w-7xl">
                <motion.p
                  className="mb-4 text-[10px] font-semibold uppercase tracking-[0.5em] text-white/70"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  {hero.intro.kicker}
                </motion.p>
                <motion.h1
                  className="text-6xl font-bold tracking-tighter text-white md:text-8xl lg:text-9xl"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.8 }}
                >
                  {hero.intro.title}
                </motion.h1>
                <motion.p
                  className="mt-4 max-w-md text-base font-normal tracking-wide text-white/70 md:text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {hero.intro.subtitle}
                </motion.p>
                <motion.div
                  className="mt-8 flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                >
                  <div className="h-px w-8 bg-white/30" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
                    Scroll to take it apart
                  </span>
                  <motion.span
                    className="text-white/50"
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                  >
                    ↓
                  </motion.span>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Story beats */}
          {hero.beats.map((beat, index) => (
            <BeatOverlay
              key={beat.index}
              beat={beat}
              progress={scrollYProgress}
              isLast={index === hero.beats.length - 1}
              product={product}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
