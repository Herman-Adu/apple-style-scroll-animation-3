"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"
import type { ParallaxHero, Product, StoryBeat } from "@/lib/types"
import { AddToCartButton } from "@/features/products"

const alignmentClass: Record<StoryBeat["align"], string> = {
  left: "items-start text-left",
  right: "items-end text-right",
  center: "items-center text-center",
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

export function ParallaxStoryHero({ hero, product }: { hero: ParallaxHero; product: Product }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Motion personality: each product choreographs the product image differently.
  // orbit -> rotates and scales around a pivot; rise -> floats upward with zoom;
  // drift -> lateral glide with subtle tilt.
  const rotate = useTransform(
    progress,
    [0, 1],
    hero.motion === "orbit" ? [-12, 14] : hero.motion === "drift" ? [-4, 6] : [0, 0],
  )
  const scale = useTransform(
    progress,
    [0, 0.5, 1],
    hero.motion === "rise" ? [1.15, 1, 0.82] : hero.motion === "orbit" ? [1.1, 0.95, 0.9] : [1.08, 1, 0.9],
  )
  const imageY = useTransform(
    progress,
    [0, 1],
    hero.motion === "rise" ? ["8%", "-24%"] : hero.motion === "drift" ? ["4%", "-12%"] : ["2%", "-14%"],
  )
  const imageX = useTransform(
    progress,
    [0, 1],
    hero.motion === "drift" ? ["-6%", "8%"] : hero.motion === "orbit" ? ["4%", "-6%"] : ["0%", "0%"],
  )

  const introOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const glowScale = useTransform(progress, [0, 0.5, 1], [1, 1.4, 1.1])
  const glowOpacity = useTransform(progress, [0, 0.5, 1], [0.5, 0.8, 0.35])

  return (
    <div ref={containerRef} className="relative" style={{ height: `${hero.scrollVh}vh` }}>
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[#050505]">
        {/* Accent glow themed per product */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{
            backgroundColor: hero.accent,
            scale: glowScale,
            opacity: glowOpacity,
          }}
          aria-hidden
        />

        {/* Product image with per-product choreography */}
        <motion.div
          className="relative h-[62vh] w-[62vh] max-w-[90vw]"
          style={{ rotate, scale, y: imageY, x: imageX }}
        >
          <Image
            src={hero.image || "/placeholder.svg"}
            alt={product.name}
            fill
            priority
            sizes="(max-width: 768px) 90vw, 62vh"
            className="object-contain drop-shadow-2xl"
          />
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
                    Scroll to explore
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
