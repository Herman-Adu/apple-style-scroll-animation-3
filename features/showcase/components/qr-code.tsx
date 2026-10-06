import { ADUDEV } from "../lib/domain/brand"
import { qrMatrix } from "../lib/domain/qr"

const QUIET_ZONE = 4

type Props = {
  text: string
  label: string
  size: number
}

export function QrCode({ text, label, size }: Props) {
  const matrix = qrMatrix(text)
  const side = matrix.length + QUIET_ZONE * 2
  const modules = matrix
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z` : "")))
    .join("")

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      className="rounded-2xl"
    >
      <rect width={side} height={side} fill={ADUDEV.colors.text} />
      <path d={modules} fill={ADUDEV.colors.base} />
    </svg>
  )
}
