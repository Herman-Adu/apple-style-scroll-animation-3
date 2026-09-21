"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"
import type { FrameHero, Product, StoryBeat } from "@/lib/types"
import { AddToCartButton } from "@/features/products"

function getFramePath(basePath: string, index: number): string {
  return `${basePath}${index.toString().padStart(5, "0")}.jpg`
}

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

  return (
    <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity }}>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
      <div className="relative px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
        <div className={`mx-auto flex max-w-7xl flex-col ${alignmentClass[beat.align]}`}>
          <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.4em] text-white/60">
            {beat.index}
          </p>
          <h2
            className="whitespace-pre-line text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.4)" }}
          >
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

export function FrameScrollHero({ hero, product }: { hero: FrameHero; product: Product }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [successCount, setSuccessCount] = useState(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // Preload every frame in the sequence.
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = []
    let loadedCount = 0
    let successfulLoads = 0

    for (let i = 0; i < hero.frameCount; i++) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = getFramePath(hero.framePath, i)

      img.onload = () => {
        loadedCount++
        successfulLoads++
        setLoadingProgress(Math.round((loadedCount / hero.frameCount) * 100))
        setSuccessCount(successfulLoads)
        if (loadedCount === hero.frameCount && successfulLoads > 0) {
          imagesRef.current = loadedImages
          setIsLoaded(true)
        }
      }
      img.onerror = () => {
        loadedCount++
        setLoadingProgress(Math.round((loadedCount / hero.frameCount) * 100))
        if (loadedCount === hero.frameCount && successfulLoads > 0) {
          imagesRef.current = loadedImages
          setIsLoaded(true)
        }
      }
      loadedImages[i] = img
    }
  }, [hero.frameCount, hero.framePath])

  // Draw the active frame to the canvas as scroll progresses.
  useEffect(() => {
    if (!isLoaded) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const render = () => {
      const images = imagesRef.current
      const frameIndex = Math.min(
        hero.frameCount - 1,
        Math.max(0, Math.floor(smoothProgress.get() * (hero.frameCount - 1))),
      )
      const img = images[frameIndex]
      if (!img || !img.complete || img.naturalWidth === 0) return

      const dpr = window.devicePixelRatio || 1
      const containerWidth = canvas.clientWidth
      const containerHeight = canvas.clientHeight
      canvas.width = containerWidth * dpr
      canvas.height = containerHeight * dpr
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      const imgAspect = img.width / img.height
      const canvasAspect = containerWidth / containerHeight
      let drawWidth: number
      let drawHeight: number
      let drawX: number
      let drawY: number

      if (imgAspect > canvasAspect) {
        drawHeight = containerHeight
        drawWidth = containerHeight * imgAspect
        drawX = (containerWidth - drawWidth) / 2
        drawY = 0
      } else {
        drawWidth = containerWidth
        drawHeight = containerWidth / imgAspect
        drawX = 0
        drawY = (containerHeight - drawHeight) / 2
      }
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    }

    render()
    const unsubscribe = smoothProgress.on("change", render)
    window.addEventListener("resize", render)
    return () => {
      unsubscribe()
      window.removeEventListener("resize", render)
    }
  }, [isLoaded, smoothProgress, hero.frameCount])

  const titleOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  return (
    <>
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]">
          <div className="mb-4 text-xl font-medium tracking-tight text-white/80">{product.name}</div>
          <div className="mb-6">
            <div className="h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-white/80"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
          <p className="font-mono text-xs tracking-widest text-white/30">Loading {loadingProgress}%</p>
          {loadingProgress === 100 && successCount === 0 && (
            <p className="mt-4 text-xs text-red-400">No images loaded. Check image paths.</p>
          )}
        </div>
      )}

      <div ref={containerRef} className="relative" style={{ height: `${hero.scrollVh}vh` }}>
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} className="h-full w-full" />

          <div className="pointer-events-none absolute inset-0">
            {/* Intro */}
            <motion.div className="absolute inset-x-0 bottom-0" style={{ opacity: titleOpacity }}>
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
              <div className="relative px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
                <div className="mx-auto max-w-7xl">
                  <motion.p
                    className="mb-4 text-[10px] font-semibold uppercase tracking-[0.5em] text-white/70"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    {hero.intro.kicker}
                  </motion.p>
                  <motion.h1
                    className="text-6xl font-bold tracking-tighter text-white md:text-8xl lg:text-9xl"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
                  >
                    {hero.intro.title}
                  </motion.h1>
                  <motion.p
                    className="mt-4 max-w-md text-base font-normal tracking-wide text-white/70 md:text-lg"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  >
                    {hero.intro.subtitle}
                  </motion.p>
                  <motion.div
                    className="mt-8 flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
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
    </>
  )
}
