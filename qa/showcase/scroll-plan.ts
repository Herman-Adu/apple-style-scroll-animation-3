interface ScrollPlanInput {
  scrollHeight: number
  viewportHeight: number
  steps: number
}

/** Keeps the first and last steps slow but never zero, so the scroll still reaches both ends. */
const EASE_FLOOR = 0.25

/**
 * Splits the distance from the top of the page to the very bottom into whole,
 * positive wheel deltas that ease in and out. The deltas always sum to
 * `scrollHeight - viewportHeight`, so the footer is guaranteed to be on screen.
 */
export function planScroll({ scrollHeight, viewportHeight, steps }: ScrollPlanInput): number[] {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new Error("steps must be a whole number of 1 or more")
  }

  const distance = Math.max(0, Math.round(scrollHeight - viewportHeight))
  if (distance === 0) return []

  const count = Math.min(steps, distance)
  const weights = Array.from({ length: count }, (_, i) => EASE_FLOOR + Math.sin((Math.PI * (i + 0.5)) / count))
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

  let travelledWeight = 0
  let travelled = 0
  return weights.map((weight) => {
    travelledWeight += weight
    const target = Math.round((distance * travelledWeight) / totalWeight)
    const delta = target - travelled
    travelled = target
    return delta
  })
}
