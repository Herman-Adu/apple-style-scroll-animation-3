import type { CSSProperties } from "react"
import { ADUDEV } from "../lib/domain/brand"

const { colors } = ADUDEV

type StepState = "done" | "current" | "next"
type Props = { steps: readonly string[]; current: number }

const markerStyle: Record<StepState, CSSProperties> = {
  current: { backgroundColor: colors.orange, borderColor: colors.orange, color: colors.onOrange },
  done: { borderColor: colors.orange, color: colors.orange },
  next: { borderColor: colors.border, color: colors.muted },
}

/** The whole flow on every slide, with the step this slide explains lit up. */
export function StepTrack({ steps, current }: Props) {
  return (
    <ol aria-label="Steps" className="mt-auto flex flex-col border-t border-border">
      {steps.map((step, index) => {
        const state: StepState = index === current ? "current" : index < current ? "done" : "next"
        return (
          <li
            key={step}
            data-step-state={state}
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-center gap-8 border-b border-border py-5"
          >
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 font-mono text-2xl font-bold tabular-nums"
              style={markerStyle[state]}
            >
              {index + 1}
            </span>
            <span
              className={state === "current" ? "text-5xl font-bold leading-tight" : "text-4xl font-medium leading-tight"}
              style={{ color: state === "next" ? colors.muted : colors.text }}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
