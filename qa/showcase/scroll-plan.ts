/**
 * Pacing for a recorded scroll.
 *
 * Pacing by a fixed step count makes a *longer* page scroll *faster*, which is
 * backwards: the homepage hero is 68% of the page, so 36 steps skipped about
 * seven canvas frames per step and the frame sequence smeared. Pace is set here
 * by how far one step travels instead, so every page reads at the same speed —
 * except a canvas frame sequence, which is given a fixed time so that none of
 * its frames are skipped at any recording size.
 */

/**
 * A canvas frame sequence gets the same time on camera whatever the recording
 * size. Its height is set in viewport units, so a fixed pixels-per-step would
 * still skip frames in the portrait formats; a fixed duration never does.
 *
 * Only a frame sequence belongs here. An ordinary scroll-triggered reveal — the
 * About timeline, say — reads as a crawl at this pace and needs nothing special.
 */
export const FRAME_SEQUENCE_MS = 12_000

/** About 660 pixels a second: brisk enough not to drag, slow enough to read. */
export const READING_PIXELS_PER_STEP = 20

/** One step per two recorded video frames, so the motion reads as a scroll and not as a series of jumps. */
export const STEP_PAUSE_MS = 30

/** Keeps the first and last steps slow but never zero, so the scroll still reaches both ends. */
const EASE_FLOOR = 0.25

/** How much of the distance each step is worth, before the deltas are rounded to whole pixels. */
type StepShape = (index: number, count: number) => number

const EASE_IN_OUT: StepShape = (index, count) => EASE_FLOOR + Math.sin((Math.PI * (index + 0.5)) / count)

/**
 * A frame sequence is scrubbed at a constant speed. Easing would make the middle
 * steps the largest ones, and those are exactly the steps that then jump two
 * frames at a time, so the middle of the sequence is what smears.
 */
const CONSTANT: StepShape = () => 1

/** A span of the document, in page coordinates, holding a scroll-scrubbed frame sequence. */
export interface FrameSequenceRange {
  start: number
  end: number
}

export interface PacedScrollInput {
  scrollHeight: number
  viewportHeight: number
  /** Where the scroll starts from, so a second pass does not re-pace what is behind it. */
  scrollY: number
  frameSequences?: readonly FrameSequenceRange[]
  frameSequenceMs?: number
  pixelsPerStep?: number
  stepPauseMs?: number
}

export interface PacedSegment {
  frameSequence: boolean
  deltas: number[]
}

/** Whole, positive wheel deltas in the given shape, summing to exactly `distance`. */
function splitDistance(distance: number, steps: number, shape: StepShape): number[] {
  const count = Math.min(steps, distance)
  const weights = Array.from({ length: count }, (_, index) => shape(index, count))
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

/** Ranges clipped to the part of the page still to be scrolled, in order, with overlaps merged. */
function rangesWithin(ranges: readonly FrameSequenceRange[], from: number, to: number): FrameSequenceRange[] {
  const clipped = ranges
    .map((range) => ({ start: Math.max(range.start, from), end: Math.min(range.end, to) }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start)

  return clipped.reduce<FrameSequenceRange[]>((merged, range) => {
    const previous = merged.at(-1)
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end)
      return merged
    }
    return [...merged, { ...range }]
  }, [])
}

/**
 * Splits the distance from the current scroll position to the very bottom of the
 * page into sections, each paced for what it shows. The deltas always sum to the
 * remaining distance, so the footer is guaranteed to be on screen.
 */
export function planPacedScroll({
  scrollHeight,
  viewportHeight,
  scrollY,
  frameSequences = [],
  frameSequenceMs = FRAME_SEQUENCE_MS,
  pixelsPerStep = READING_PIXELS_PER_STEP,
  stepPauseMs = STEP_PAUSE_MS,
}: PacedScrollInput): PacedSegment[] {
  if (pixelsPerStep < 1) throw new Error("pixelsPerStep must be at least one pixel per step")
  if (stepPauseMs < 1) throw new Error("stepPauseMs must be a step pause of at least one millisecond")

  const from = Math.max(0, Math.round(scrollY))
  const to = Math.round(scrollHeight - viewportHeight)
  if (to <= from) return []

  const frameSteps = Math.max(1, Math.round(frameSequenceMs / stepPauseMs))
  const readingSegment = (distance: number): PacedSegment => ({
    frameSequence: false,
    deltas: splitDistance(distance, Math.max(1, Math.round(distance / pixelsPerStep)), EASE_IN_OUT),
  })

  const segments: PacedSegment[] = []
  let cursor = from
  for (const range of rangesWithin(frameSequences, from, to)) {
    if (range.start > cursor) segments.push(readingSegment(range.start - cursor))
    segments.push({ frameSequence: true, deltas: splitDistance(range.end - range.start, frameSteps, CONSTANT) })
    cursor = range.end
  }
  if (to > cursor) segments.push(readingSegment(to - cursor))

  return segments
}
