"use client"

import { useRef } from "react"
import { motion, useScroll, useSpring, useInView, type Variants } from "framer-motion"
import { Compass, AudioWaveform, FlaskConical, Headphones, type LucideIcon } from "lucide-react"
import type { Milestone } from "../schema"

const iconMap: Record<string, LucideIcon> = {
  compass: Compass,
  waveform: AudioWaveform,
  flask: FlaskConical,
  headphones: Headphones,
}

export function AboutTimeline({ milestones }: { milestones: Milestone[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll progress mapped to the timeline's own travel through the viewport.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 55%"],
  })
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  })

  return (
    <div ref={containerRef} className="relative mx-auto max-w-5xl">
      {/* Static track */}
      <div
        className="absolute left-[19px] top-0 bottom-0 w-px bg-foreground/12 md:left-1/2 md:-translate-x-1/2"
        aria-hidden
      />
      {/* Animated teal progress line */}
      <motion.div
        className="absolute left-[19px] top-0 bottom-0 w-px origin-top md:left-1/2 md:-translate-x-1/2"
        style={{
          scaleY: progress,
          background:
            "linear-gradient(to bottom, transparent, var(--accent-teal) 12%, var(--accent-teal) 88%, transparent)",
          boxShadow: "0 0 12px 0 color-mix(in oklch, var(--accent-teal) 55%, transparent)",
        }}
        aria-hidden
      />

      <ul className="flex flex-col gap-16 md:gap-24">
        {milestones.map((milestone, index) => (
          <TimelineItem key={milestone.year} milestone={milestone} index={index} />
        ))}
      </ul>
    </div>
  )
}

function TimelineItem({ milestone, index }: { milestone: Milestone; index: number }) {
  const itemRef = useRef<HTMLLIElement>(null)
  const inView = useInView(itemRef, { once: true, margin: "-120px 0px -120px 0px" })
  const Icon = iconMap[milestone.icon] ?? Compass
  const isLeft = index % 2 === 0

  const contentVariants: Variants = {
    hidden: { opacity: 0, x: isLeft ? 36 : -36, y: 16 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  }

  const words = milestone.title.split(" ")

  return (
    <li ref={itemRef} className="relative pl-14 md:grid md:grid-cols-2 md:items-center md:gap-16 md:pl-0">
      {/* Icon node */}
      <div className="absolute left-0 top-0 md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
        {/* pulsing halo */}
        <motion.span
          className="absolute inset-0 rounded-full bg-accent-teal/25"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={inView ? { scale: [0.8, 1.8, 1.5], opacity: [0.6, 0, 0] } : {}}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.15 }}
          aria-hidden
        />
        <motion.span
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent-teal/40 bg-background text-accent-teal"
          initial={{ scale: 0, rotate: -90 }}
          animate={inView ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          style={{ boxShadow: "0 0 0 4px color-mix(in oklch, var(--accent-teal) 8%, transparent)" }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.4 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.32 }}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </motion.span>
        </motion.span>
      </div>

      {/* Content */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className={isLeft ? "md:col-start-1 md:pr-20 md:text-right" : "md:col-start-2 md:pl-20"}
      >
        <motion.p
          className="font-mono text-4xl font-semibold tracking-tight text-foreground/15 md:text-5xl"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          {milestone.year}
        </motion.p>

        <h3 className="mt-2 flex flex-wrap gap-x-2 text-2xl font-semibold text-foreground md:text-[1.75rem] md:leading-tight">
          <span className={isLeft ? "flex flex-wrap gap-x-2 md:ml-auto md:justify-end" : "flex flex-wrap gap-x-2"}>
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block overflow-hidden">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={inView ? { y: "0%" } : {}}
                  transition={{
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.28 + wordIndex * 0.06,
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </span>
        </h3>

        <motion.p
          className="mt-3 max-w-sm text-sm leading-relaxed text-foreground/55 md:text-base"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <span className={isLeft ? "md:ml-auto md:block" : ""}>{milestone.description}</span>
        </motion.p>
      </motion.div>
    </li>
  )
}
