import { ADUDEV } from "../lib/domain/brand"
import { LAYER_STEPS } from "../lib/domain/social-assets"

const { colors } = ADUDEV

export function LayersGraphic() {
  return (
    <ol aria-label="A request passes three gates" className="flex h-full flex-col justify-center">
      <li className="flex flex-col items-center">
        <span className="rounded-full border border-border px-6 py-2 text-2xl font-medium text-muted-foreground">Request</span>
        <span aria-hidden className="h-8 w-0.5" style={{ backgroundColor: colors.orange }} />
      </li>
      {LAYER_STEPS.map((step, index) => (
        <li key={step.name} className="flex flex-col items-center">
          <div className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-3xl font-semibold">{step.name}</span>
              <span
                className="rounded-md px-3 py-1 text-xl font-semibold uppercase tracking-wider"
                style={{ backgroundColor: colors.orange, color: colors.onOrange }}
              >
                Gate {index + 1}
              </span>
            </div>
            <span className="text-2xl leading-snug text-muted-foreground">{step.detail}</span>
          </div>
          <span aria-hidden className="h-8 w-0.5" style={{ backgroundColor: colors.orange }} />
        </li>
      ))}
      <li className="flex flex-col items-center">
        <span className="rounded-full border px-6 py-2 text-2xl font-medium" style={{ borderColor: colors.orange }}>
          Action runs
        </span>
      </li>
    </ol>
  )
}
