import { renderOgImage, OG_SIZE } from "@/lib/seo/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Momo Audio — reference-grade sound"

export default function Image() {
  return renderOgImage({
    eyebrow: "Momo Audio",
    title: "Reference-grade sound, engineered in the lab.",
    footer: "momoaudio.com",
  })
}
